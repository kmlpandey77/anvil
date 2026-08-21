use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Read, Seek, SeekFrom};
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Product {
    id: String,
    name: String,
    path: String,
    php_binary: String,
}

fn products_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("products.json"))
}

fn read_products(app: &AppHandle) -> Result<Vec<Product>, String> {
    let file = products_file(app)?;
    if !file.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&file).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

fn write_products(app: &AppHandle, products: &[Product]) -> Result<(), String> {
    let file = products_file(app)?;
    let raw = serde_json::to_string_pretty(products).map_err(|e| e.to_string())?;
    fs::write(&file, raw).map_err(|e| e.to_string())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Snippet {
    id: String,
    product_id: String,
    name: String,
    code: String,
}

fn snippets_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("snippets.json"))
}

fn read_snippets(app: &AppHandle) -> Result<Vec<Snippet>, String> {
    let file = snippets_file(app)?;
    if !file.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&file).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

fn write_snippets(app: &AppHandle, snippets: &[Snippet]) -> Result<(), String> {
    let file = snippets_file(app)?;
    let raw = serde_json::to_string_pretty(snippets).map_err(|e| e.to_string())?;
    fs::write(&file, raw).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_snippets(app: AppHandle, product_id: String) -> Result<Vec<Snippet>, String> {
    Ok(read_snippets(&app)?
        .into_iter()
        .filter(|s| s.product_id == product_id)
        .collect())
}

#[tauri::command]
fn save_snippet(app: AppHandle, product_id: String, name: String, code: String) -> Result<Snippet, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("Name is required.".into());
    }
    let mut snippets = read_snippets(&app)?;
    let snippet = Snippet {
        id: new_id(),
        product_id,
        name: name.to_string(),
        code,
    };
    snippets.push(snippet.clone());
    write_snippets(&app, &snippets)?;
    Ok(snippet)
}

#[tauri::command]
fn delete_snippet(app: AppHandle, id: String) -> Result<(), String> {
    let mut snippets = read_snippets(&app)?;
    snippets.retain(|s| s.id != id);
    write_snippets(&app, &snippets)
}

fn new_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{nanos:x}")
}

#[tauri::command]
fn list_products(app: AppHandle) -> Result<Vec<Product>, String> {
    read_products(&app)
}

#[tauri::command]
fn add_product(
    app: AppHandle,
    name: String,
    path: String,
    php_binary: String,
) -> Result<Product, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("Name is required.".into());
    }
    if !PathBuf::from(&path).join("artisan").is_file() {
        return Err(format!("No 'artisan' file found at {path} — is this a Laravel project root?"));
    }
    let php_binary = {
        let trimmed = php_binary.trim();
        if trimmed.is_empty() { "php".to_string() } else { trimmed.to_string() }
    };

    let mut products = read_products(&app)?;
    let product = Product {
        id: new_id(),
        name: name.to_string(),
        path,
        php_binary,
    };
    products.push(product.clone());
    write_products(&app, &products)?;
    Ok(product)
}

#[tauri::command]
fn remove_product(app: AppHandle, id: String) -> Result<(), String> {
    let mut products = read_products(&app)?;
    products.retain(|p| p.id != id);
    write_products(&app, &products)
}

#[derive(Debug, Serialize)]
struct RunResult {
    stdout: String,
    stderr: String,
    success: bool,
}

// ponytail: naive single-line-expression heuristic (no newline/`;` inside,
// doesn't start with a statement keyword) auto-wraps in dump() (Laravel's
// pretty, collapsible dd()-style output — see VAR_DUMPER_FORMAT in exec_php)
// so common one-liners like `1+1` or `User::count()` print without an
// explicit dump()/echo.
// Real REPL semantics (auto-print last expression of any snippet) would need a
// PHP parser — most Laravel apps already ship psy/psysh via laravel/tinker,
// which could replace this whole wrap_snippet approach if it's ever worth it.
fn wrap_snippet(code: &str) -> String {
    let trimmed = code.trim();
    let body = trimmed.strip_suffix(';').unwrap_or(trimmed);
    let first_word = body
        .split(|c: char| c.is_whitespace() || c == '(')
        .next()
        .unwrap_or("")
        .to_lowercase();
    const STATEMENT_KEYWORDS: &[&str] = &[
        "if", "for", "foreach", "while", "do", "switch", "function", "class",
        "namespace", "use", "return", "echo", "print", "dump", "dd", "var_dump",
        "try", "throw", "abstract", "final", "interface", "trait", "enum", "",
    ];
    if body.contains(';') || body.contains('\n') || STATEMENT_KEYWORDS.contains(&first_word.as_str())
    {
        code.to_string()
    } else {
        format!("dump({body});")
    }
}

fn find_product(app: &AppHandle, product_id: &str) -> Result<Product, String> {
    read_products(app)?
        .into_iter()
        .find(|p| p.id == product_id)
        .ok_or_else(|| "Product not found.".to_string())
}

fn exec_php(product: &Product, script: &str) -> Result<RunResult, String> {
    let project_path = PathBuf::from(&product.path);
    let mut tmp = std::env::temp_dir();
    tmp.push(format!("laravel-toolkit-{}.php", new_id()));
    fs::write(&tmp, script).map_err(|e| e.to_string())?;

    let result = Command::new(&product.php_binary)
        .arg(&tmp)
        .current_dir(&project_path)
        // Forces Symfony VarDumper (dump()/dd() — always available, it's a
        // dependency of laravel/framework) to emit its rich HTML dump
        // instead of the plain CLI/ANSI format it'd otherwise pick for a
        // `php script.php` process. The frontend renders stdout in a
        // sandboxed iframe for exactly this reason.
        .env("VAR_DUMPER_FORMAT", "html")
        .output();

    let _ = fs::remove_file(&tmp);

    let output = result.map_err(|e| format!("failed to run '{}': {e}", product.php_binary))?;

    Ok(RunResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        success: output.status.success(),
    })
}

// Shared by any command that needs the app's service container (DB config,
// Eloquent, etc.) rather than just the autoloader — run_snippet.
fn bootstrap_header(product: &Product) -> Result<String, String> {
    let project_path = PathBuf::from(&product.path);
    let autoload = project_path.join("vendor/autoload.php");
    if !autoload.is_file() {
        return Err(format!(
            "vendor/autoload.php not found — run composer install in {}",
            product.path
        ));
    }
    let bootstrap_file = project_path.join("bootstrap/app.php");
    if !bootstrap_file.is_file() {
        return Err(format!(
            "bootstrap/app.php not found in {} — is this a Laravel project?",
            product.path
        ));
    }
    Ok(format!(
        "require {:?};\n$app = require {:?};\n$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();\n",
        autoload.to_string_lossy(),
        bootstrap_file.to_string_lossy(),
    ))
}

#[tauri::command]
fn run_snippet(app: AppHandle, product_id: String, code: String) -> Result<RunResult, String> {
    let product = find_product(&app, &product_id)?;
    let header = bootstrap_header(&product)?;
    let script = format!("<?php\n{header}\n{}\n", wrap_snippet(&code));
    exec_php(&product, &script)
}

#[derive(Debug, Deserialize)]
struct Psr4Dump {
    psr4: std::collections::HashMap<String, Vec<String>>,
    functions: Vec<String>,
}

#[derive(Debug, Serialize)]
struct Symbols {
    classes: Vec<String>,
    functions: Vec<String>,
}

const SYMBOL_SCAN_MAX_FILES: usize = 8000;
const SYMBOL_SCAN_SKIP_DIRS: &[&str] = &["vendor", "node_modules", ".git", "storage"];

// Walks a PSR-4 namespace root, deriving `Namespace\Sub\Class` for every .php
// file found. Depth-first, capped at SYMBOL_SCAN_MAX_FILES so a huge or
// symlink-looped directory can't hang the scan.
fn collect_classes(dir: &PathBuf, namespace_prefix: &str, out: &mut Vec<String>) {
    if out.len() >= SYMBOL_SCAN_MAX_FILES {
        return;
    }
    let Ok(entries) = fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        if out.len() >= SYMBOL_SCAN_MAX_FILES {
            return;
        }
        let path = entry.path();
        let Some(file_name) = path.file_name().and_then(|n| n.to_str()) else { continue };
        if path.is_dir() {
            if SYMBOL_SCAN_SKIP_DIRS.contains(&file_name) || file_name.starts_with('.') {
                continue;
            }
            let sub_namespace = format!("{namespace_prefix}{file_name}\\");
            collect_classes(&path, &sub_namespace, out);
        } else if let Some(stem) = file_name.strip_suffix(".php") {
            out.push(format!("{namespace_prefix}{stem}"));
        }
    }
}

#[tauri::command]
fn list_symbols(app: AppHandle, product_id: String) -> Result<Symbols, String> {
    let product = find_product(&app, &product_id)?;

    let project_path = PathBuf::from(&product.path);
    let autoload = project_path.join("vendor/autoload.php");
    if !autoload.is_file() {
        return Err(format!(
            "vendor/autoload.php not found — run composer install in {}",
            product.path
        ));
    }

    // vendor/autoload.php just registers Composer's PSR-4 autoloader and
    // returns the ClassLoader — it does not boot Laravel or touch the DB.
    // ob_start/ob_end_clean: any notice/deprecation warning PHP prints while
    // autoloading (common on real projects, e.g. PHP 8.1+ deprecations) would
    // otherwise land before our JSON on stdout and break parsing on the Rust
    // side — this guarantees stdout is exactly the JSON we echo, nothing else.
    let script = format!(
        "<?php\nob_start();\n$loader = require {:?};\n$output = json_encode(['psr4' => $loader->getPrefixesPsr4(), 'functions' => get_defined_functions()['internal']]);\nob_end_clean();\necho $output;\n",
        autoload.to_string_lossy(),
    );

    let result = exec_php(&product, &script)?;
    if !result.success {
        return Err(if result.stderr.is_empty() { result.stdout } else { result.stderr });
    }

    let dump: Psr4Dump = serde_json::from_str(&result.stdout)
        .map_err(|e| format!("could not parse autoloader output: {e}"))?;

    let mut classes = Vec::new();
    'prefixes: for (namespace, dirs) in dump.psr4 {
        for dir in dirs {
            if classes.len() >= SYMBOL_SCAN_MAX_FILES {
                break 'prefixes;
            }
            collect_classes(&PathBuf::from(dir), &namespace, &mut classes);
        }
    }
    classes.sort();
    classes.dedup();

    Ok(Symbols {
        classes,
        functions: dump.functions,
    })
}

#[derive(Debug, Serialize, Deserialize)]
struct Members {
    members: Vec<Member>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
struct Member {
    name: String,
    kind: String, // "method" | "property"
    is_static: bool,
}

#[tauri::command]
fn list_members(app: AppHandle, product_id: String, class_name: String) -> Result<Members, String> {
    let product = find_product(&app, &product_id)?;

    let project_path = PathBuf::from(&product.path);
    let autoload = project_path.join("vendor/autoload.php");
    if !autoload.is_file() {
        return Err(format!(
            "vendor/autoload.php not found — run composer install in {}",
            product.path
        ));
    }

    // Reflection only — doesn't boot Laravel, so Facade aliases (Route:: without
    // the full namespace) won't resolve here even though they work at run time.
    // @property/@method docblock tags (e.g. from `php artisan ide-helper:models`)
    // are picked up too, since we read them straight off the class via reflection —
    // no dependency on the ide-helper package itself, just its output format.
    // ob_start/ob_end_clean: same reasoning as list_symbols — autoloading a real
    // project's classes can print notices/deprecations that would otherwise
    // corrupt the JSON on stdout.
    let script = format!(
        r#"<?php
ob_start();
require {autoload:?};
$name = {class_name:?};
$members = [];
if (class_exists($name) || interface_exists($name) || trait_exists($name)) {{
    $class = new ReflectionClass($name);
    foreach ($class->getMethods(ReflectionMethod::IS_PUBLIC) as $m) {{
        if ($m->isConstructor() || $m->isDestructor()) continue;
        $members[] = ['name' => $m->getName(), 'kind' => 'method', 'is_static' => $m->isStatic()];
    }}
    foreach ($class->getProperties(ReflectionProperty::IS_PUBLIC) as $p) {{
        $members[] = ['name' => $p->getName(), 'kind' => 'property', 'is_static' => $p->isStatic()];
    }}
    $doc = '';
    for ($c = $class; $c; $c = $c->getParentClass()) {{
        $doc .= ($c->getDocComment() ?: '') . "\n";
    }}
    if (preg_match_all('/@property(?:-read|-write)?\s+\S+\s+\$(\w+)/', $doc, $m1)) {{
        foreach ($m1[1] as $propName) {{
            $members[] = ['name' => $propName, 'kind' => 'property', 'is_static' => false];
        }}
    }}
    if (preg_match_all('/@method\s+(?:static\s+)?\S+\s+(\w+)\s*\(/', $doc, $m2)) {{
        foreach ($m2[1] as $methodName) {{
            $members[] = ['name' => $methodName, 'kind' => 'method', 'is_static' => false];
        }}
    }}
}}
$output = json_encode(['members' => $members]);
ob_end_clean();
echo $output;
"#,
        autoload = autoload.to_string_lossy(),
        class_name = class_name,
    );

    let result = exec_php(&product, &script)?;
    if !result.success {
        return Err(if result.stderr.is_empty() { result.stdout } else { result.stderr });
    }

    let mut members: Vec<Member> = serde_json::from_str::<Members>(&result.stdout)
        .map_err(|e| format!("could not parse reflection output: {e}"))?
        .members;
    members.sort();
    members.dedup();

    Ok(Members { members })
}

#[derive(Debug, Serialize)]
struct ArtisanCommandInfo {
    name: String,
    description: String,
}

#[derive(Debug, Deserialize)]
struct ArtisanListJson {
    commands: Vec<ArtisanListCommand>,
}

#[derive(Debug, Deserialize)]
struct ArtisanListCommand {
    name: String,
    #[serde(default)]
    description: String,
}

fn artisan_path(product: &Product) -> Result<PathBuf, String> {
    let path = PathBuf::from(&product.path).join("artisan");
    if !path.is_file() {
        return Err(format!("No 'artisan' file found in {}", product.path));
    }
    Ok(path)
}

#[tauri::command]
fn list_artisan_commands(app: AppHandle, product_id: String) -> Result<Vec<ArtisanCommandInfo>, String> {
    let product = find_product(&app, &product_id)?;
    let artisan = artisan_path(&product)?;

    let output = Command::new(&product.php_binary)
        .arg(&artisan)
        .arg("list")
        .arg("--format=json")
        .current_dir(&product.path)
        .output()
        .map_err(|e| format!("failed to run '{}': {e}", product.php_binary))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(if stderr.is_empty() {
            String::from_utf8_lossy(&output.stdout).to_string()
        } else {
            stderr.to_string()
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed: ArtisanListJson =
        serde_json::from_str(&stdout).map_err(|e| format!("could not parse artisan output: {e}"))?;

    Ok(parsed
        .commands
        .into_iter()
        .map(|c| ArtisanCommandInfo {
            name: c.name,
            description: c.description,
        })
        .collect())
}

#[tauri::command]
fn run_artisan_command(
    app: AppHandle,
    product_id: String,
    command: String,
    args: Vec<String>,
) -> Result<RunResult, String> {
    let product = find_product(&app, &product_id)?;
    let artisan = artisan_path(&product)?;

    let output = Command::new(&product.php_binary)
        .arg(&artisan)
        .arg(&command)
        .args(&args)
        .current_dir(&product.path)
        .output()
        .map_err(|e| format!("failed to run '{}': {e}", product.php_binary))?;

    Ok(RunResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        success: output.status.success(),
    })
}

const LOG_TAIL_MAX_BYTES: u64 = 100_000;

// Picks the most recently modified *.log in a directory — covers both
// Laravel's default single laravel.log and the "daily" driver's rotated
// laravel-YYYY-MM-DD.log files.
fn newest_log_file(logs_dir: &PathBuf) -> Option<PathBuf> {
    let entries = fs::read_dir(logs_dir).ok()?;
    entries
        .flatten()
        .filter(|e| e.path().extension().and_then(|s| s.to_str()) == Some("log"))
        .filter_map(|e| {
            let modified = e.metadata().ok()?.modified().ok()?;
            Some((e.path(), modified))
        })
        .max_by_key(|(_, modified)| *modified)
        .map(|(path, _)| path)
}

#[tauri::command]
fn read_log_tail(app: AppHandle, product_id: String) -> Result<String, String> {
    let product = find_product(&app, &product_id)?;
    let logs_dir = PathBuf::from(&product.path).join("storage/logs");
    let path = newest_log_file(&logs_dir)
        .ok_or_else(|| format!("No .log files found in {}", logs_dir.display()))?;

    let mut file = fs::File::open(&path).map_err(|e| e.to_string())?;
    let len = file.metadata().map_err(|e| e.to_string())?.len();
    let start = len.saturating_sub(LOG_TAIL_MAX_BYTES);
    file.seek(SeekFrom::Start(start)).map_err(|e| e.to_string())?;

    let mut buf = Vec::new();
    file.read_to_end(&mut buf).map_err(|e| e.to_string())?;

    Ok(String::from_utf8_lossy(&buf).to_string())
}

#[cfg(test)]
mod tests {
    use super::{collect_classes, newest_log_file, wrap_snippet};

    #[test]
    fn wraps_simple_expressions() {
        assert_eq!(wrap_snippet("1+1"), "dump(1+1);");
        assert_eq!(wrap_snippet("User::count()"), "dump(User::count());");
        assert_eq!(wrap_snippet("$x"), "dump($x);");
    }

    #[test]
    fn leaves_statements_and_multiline_untouched() {
        assert_eq!(wrap_snippet("echo 1;"), "echo 1;");
        // single assignment IS wrapped: dump($x = 1) both assigns and shows
        // the value, matching REPL expectations.
        assert_eq!(wrap_snippet("$x = 1;"), "dump($x = 1);");
        assert_eq!(wrap_snippet("$x = 1;\n$y = 2;"), "$x = 1;\n$y = 2;");
        assert_eq!(wrap_snippet("if (true) { echo 1; }"), "if (true) { echo 1; }");
    }

    #[test]
    fn collects_classes_from_nested_dirs_and_skips_vendor() {
        let dir = std::env::temp_dir().join(format!("laravel-toolkit-test-{}", super::new_id()));
        std::fs::create_dir_all(dir.join("Models")).unwrap();
        std::fs::create_dir_all(dir.join("vendor")).unwrap();
        std::fs::write(dir.join("Models/User.php"), "<?php").unwrap();
        std::fs::write(dir.join("Helper.php"), "<?php").unwrap();
        std::fs::write(dir.join("vendor/Ignored.php"), "<?php").unwrap();

        let mut out = Vec::new();
        collect_classes(&dir, "App\\", &mut out);
        out.sort();

        assert_eq!(out, vec!["App\\Helper", "App\\Models\\User"]);
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn newest_log_file_picks_most_recently_modified_dot_log() {
        let dir = std::env::temp_dir().join(format!("laravel-toolkit-test-{}", super::new_id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("laravel-2024-01-01.log"), "old").unwrap();
        std::thread::sleep(std::time::Duration::from_millis(10));
        std::fs::write(dir.join("laravel-2024-01-02.log"), "new").unwrap();
        std::fs::write(dir.join("not-a-log.txt"), "ignored").unwrap();

        let picked = newest_log_file(&dir).unwrap();

        assert_eq!(picked.file_name().unwrap(), "laravel-2024-01-02.log");
        std::fs::remove_dir_all(&dir).unwrap();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_products,
            add_product,
            remove_product,
            run_snippet,
            list_symbols,
            list_members,
            list_artisan_commands,
            run_artisan_command,
            read_log_tail,
            list_snippets,
            save_snippet,
            delete_snippet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
