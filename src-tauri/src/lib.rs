use serde::{Deserialize, Serialize};
use std::fs;
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
// doesn't start with a statement keyword) auto-wraps in var_dump so common
// one-liners like `1+1` or `User::count()` print without an explicit dump()/echo.
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
        format!("var_dump({body});")
    }
}

#[tauri::command]
fn run_snippet(app: AppHandle, product_id: String, code: String) -> Result<RunResult, String> {
    let products = read_products(&app)?;
    let product = products
        .into_iter()
        .find(|p| p.id == product_id)
        .ok_or_else(|| "Product not found.".to_string())?;

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

    let script = format!(
        "<?php\nrequire {:?};\n$app = require {:?};\n$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();\n\n{}\n",
        autoload.to_string_lossy(),
        bootstrap_file.to_string_lossy(),
        wrap_snippet(&code),
    );

    let mut tmp = std::env::temp_dir();
    tmp.push(format!("laravel-toolkit-{}.php", new_id()));
    fs::write(&tmp, &script).map_err(|e| e.to_string())?;

    let result = Command::new(&product.php_binary)
        .arg(&tmp)
        .current_dir(&project_path)
        .output();

    let _ = fs::remove_file(&tmp);

    let output = result.map_err(|e| format!("failed to run '{}': {e}", product.php_binary))?;

    Ok(RunResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        success: output.status.success(),
    })
}

#[cfg(test)]
mod tests {
    use super::wrap_snippet;

    #[test]
    fn wraps_simple_expressions() {
        assert_eq!(wrap_snippet("1+1"), "var_dump(1+1);");
        assert_eq!(wrap_snippet("User::count()"), "var_dump(User::count());");
        assert_eq!(wrap_snippet("$x"), "var_dump($x);");
    }

    #[test]
    fn leaves_statements_and_multiline_untouched() {
        assert_eq!(wrap_snippet("echo 1;"), "echo 1;");
        // single assignment IS wrapped: var_dump($x = 1) both assigns and shows
        // the value, matching REPL expectations.
        assert_eq!(wrap_snippet("$x = 1;"), "var_dump($x = 1);");
        assert_eq!(wrap_snippet("$x = 1;\n$y = 2;"), "$x = 1;\n$y = 2;");
        assert_eq!(wrap_snippet("if (true) { echo 1; }"), "if (true) { echo 1; }");
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
            run_snippet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
