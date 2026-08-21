# Laravel Toolkit — Desktop App (Tinkerwell-alike)

Tauri + React + shadcn/ui desktop app for running PHP/Laravel snippets against real local projects.

## Scope (MVP, no more)

1. **Projects ("products")** — save a connection to a local Laravel app (path only). Switch between them. Run PHP code inside that project's booted context. ✅ shipped
2. **REPL / scratchpad** — write PHP, run it, see the result (value, echo/dump output, errors) inline. ✅ shipped
3. **Autocomplete** — as you type, suggest PHP keywords/built-in functions plus the connected project's own classes (`App\Models\User`, etc.), pulled from the real project, not a static guess. ✅ shipped
4. **Member completion** — after `Class::` or `$var->` (where `$var` was assigned via `$var = new Class(`), suggest real public methods/properties via PHP reflection, plus `@property`/`@method` docblock tags (picked up automatically if the project has run `php artisan ide-helper:models` — no dependency on the package itself, just its output format). ✅ shipped

5. **Artisan runner** — list the project's real `artisan` commands and run one, output shown the same way as a snippet. ✅ shipped
6. **Log tailing** — poll `storage/logs/*.log` and show the tail, while the Logs tab is open. ✅ shipped
7. **DB/table browser** — run raw SQL through the project's configured Laravel DB connection, results rendered as a table instead of a `var_dump` blob. 🚧 in progress
8. **Snippet history** — save/load/delete named snippets per product. 🚧 in progress

Explicitly out of scope: SSH/remote/Docker connections, multi-environment products, XDebug, AI chat, team/sharing, and any Laravel-version compatibility checker (dropped — not needed). Add later only if actually needed.

## Why Tauri, not Electron

Rust shell is small/fast; we don't need Node in the runtime. React+shadcn runs as the webview frontend as normal.

## How code actually executes (the core mechanic) — shipped

No PHP-in-Rust, no embedding a PHP engine. Reuse the project's own PHP CLI binary, the same way `php artisan tinker` does it.

- Rust (`run_snippet` Tauri command) shells out to `php` (product-configured binary, default `php` on `$PATH`) with a small bootstrap wrapper script (temp file): `require vendor/autoload.php`, boot the Kernel from `bootstrap/app.php`, then the snippet.
- stdout/stderr/exit status captured, sent back to the frontend as the run result.
- A "product" is just a saved `{ id, name, path, php_binary }`, persisted as `products.json` in the app data dir — no database.
- Single-line expressions with no explicit `dump()`/`echo` (e.g. `1+1`, `User::count()`) are auto-wrapped in `var_dump()` via a small heuristic in `wrap_snippet` (unit-tested). Real "auto-print last expression of any snippet" semantics would need a PHP parser — most Laravel apps already ship `psy/psysh` via `laravel/tinker`, which could replace this heuristic later if it's ever worth it.

## Autocomplete — how it will work

Same "reuse the real project" philosophy as running code — no bundled PHP language server, no guessing.

- New Rust command `list_symbols(product_id)`:
  1. Shell out to the product's `php` binary running a tiny script that does `$loader = require vendor/autoload.php; echo json_encode(['psr4' => $loader->getPrefixesPsr4(), 'functions' => get_defined_functions()['internal']]);`. `vendor/autoload.php` just registers Composer's PSR-4 autoloader — it does **not** boot Laravel or touch the DB, so this is cheap and side-effect-free.
  2. Rust parses the JSON, then walks each PSR-4 namespace's directories on disk (skip `vendor/`, depth-limited) and derives fully-qualified class names from the `.php` file paths.
  3. Returns `{ classes: string[], functions: string[] }` to the frontend.
- Frontend caches this per selected product (fetched once on selection, not per keystroke).
- A CodeMirror `autocompletion()` source merges: a small hardcoded PHP keyword list, the project's built-in function names, and its class names (inserted fully-qualified, since a REPL snippet has no persistent `use` imports).

### Member completion — shipped

- New Rust command `list_members(product_id, class_name)`: same autoload-only bootstrap as `list_symbols` (no Kernel boot — so Facade aliases like `Route::` without the full namespace won't resolve here, even though they'd work at run time), then `ReflectionClass` for real public methods/properties, plus a regex pass over the class's own docblock (and its parents') for `@property`/`@property-read`/`@property-write`/`@method` tags. This is exactly the format `php artisan ide-helper:models --write` writes into model files — we just read it, no dependency on `barryvdh/laravel-ide-helper` itself required, but the project benefits automatically if it's used.
- Frontend trigger (`registerPhpCompletionProviders` in `src/lib/symbols.ts`, registered against Monaco's `languages.registerCompletionItemProvider('php', ...)`): matches `Class::` (resolves `Class` against known project classes by exact/short-name, else passes through as-is so fully-qualified vendor classes like `\Illuminate\Support\Str` still work) or `$var->` (resolved only via a backward regex scan for `$var = new ClassName(` earlier in the same buffer — not real type inference, so `User::first()->` chains won't resolve).
- Deliberately not built this pass: parsing ide-helper's separate `_ide_helper.php`/`_ide_helper_models.php` helper files (a different, more complex nested-namespace format than inline docblocks) — would add Facade method completion (`Route::`, `DB::`) but wasn't worth the extra parser yet. Natural next step if facades turn out to matter.

## Tech stack

- **Shell**: Tauri v2 (Rust backend, plain `std::process::Command` for spawning `php` — no shell plugin needed, we're not running arbitrary shell commands).
- **Frontend**: React + Vite + TypeScript + shadcn/ui + Tailwind v4.
- **Editor**: Monaco (`@monaco-editor/react`), self-hosted rather than the default CDN load (a desktop app needs to work offline) — `src/lib/monaco-setup.ts` points `@monaco-editor/react`'s loader at the local `monaco-editor` package and wires a Vite-bundled worker. Imports `editor.main.js`, not the bare `editor.api` — the API surface alone doesn't register editor *features* (suggest widget, hover, find, bracket matching — ~60 separate `contrib/*` modules), so trimming to just `editor.api` silently broke autocomplete (no suggest controller existed to show a dropdown). `editor.main.js` also registers every language Monaco ships, but each is just a small lazy-loaded registration — the actual tokenizer module only downloads if that language is used, so this didn't reintroduce the "every language's tokenizer in the bundle" problem, just its own eager cost (LSP client + rich TS/CSS/HTML/JSON language services), landing the main bundle back around ~4.3MB. Correctness over the size shave.
  - Monaco's *built-in* `php` language is designed for `.php` files mixing HTML with `<?php ?>` tags — its tokenizer only leaves HTML-detection mode after seeing the opening tag, so a bare snippet with none rendered as one flat, uncolored run of text (same category of bug as the CodeMirror `plain: true` fix earlier, but Monaco has no such flag). Fixed by registering our own tokenizer for `php` that reuses Monaco's actual PHP token rules directly — the self-contained `phpRoot` state, normally only reached via the tag — as the entry point, skipping HTML-detection entirely (see `monaco-setup.ts` and `monaco-php.d.ts`, the latter a small ambient-module shim since Monaco ships this file as plain `.js` with no types).
  - Completion is wired via `languages.registerCompletionItemProvider('php', ...)`, re-registered (with disposal of the previous registration — that API is global per-language, not per-editor-instance) whenever the product or its symbols change.
- **State**: React state + one JSON file (`products.json`) via Rust/serde. No database, no Zustand/Redux.
- **Dialogs**: `tauri-plugin-dialog` for the native folder picker.

## Data model (`products.json` in app data dir)

```ts
type Product = {
  id: string;      // hex timestamp, not uuid — single-user local list
  name: string;
  path: string;     // project root, must contain artisan
  php_binary: string; // default "php"
};
```

## Milestones

1. ✅ **Scaffold**: Tauri (React-TS) + Tailwind v4 + shadcn/ui (Radix/Nova).
2. ✅ **Product CRUD**: add/list/remove products, persisted to `products.json`. Folder picker + `artisan` validation.
3. ✅ **Run snippet**: `run_snippet` Rust command, bootstrap temp file, CodeMirror editor + Run button (⌘Enter), stdout/stderr panel.
4. ✅ **Autocomplete**: `list_symbols` Rust command (PSR-4 class walk + built-in functions) + CodeMirror completion source.
5. ✅ **Member completion**: `list_members` Rust command (reflection + docblock parsing) + `::`/`->` triggers.
6. ✅ **Settings**: theme (light/dark/system via `next-themes`, already a shadcn-init dependency) + editor font size/family, persisted in `localStorage` (per-viewer UI preference, not project data — doesn't belong in the Rust-backed `products.json`).
7. ✅ **Artisan runner**: `list_artisan_commands` (`php artisan list --format=json`) + `run_artisan_command`, a new "Artisan" tab.
8. ✅ **Log tailing**: `read_log_tail` (find newest `storage/logs/*.log`, read its tail), frontend polls every ~2s while the "Logs" tab is open — no filesystem-watcher plugin, polling is simpler and good enough for a log viewer.
9. 🚧 **DB/table browser**: `run_query` (boots the Kernel like `run_snippet`, runs `DB::select($sql)`, returns rows as JSON), a new "Database" tab renders them as an actual table. SQL only (no arbitrary PHP) — that's the point of the tab.
10. 🚧 **Snippet history**: `snippets.json` in the app data dir (same pattern as `products.json`), keyed by product — save/load/delete named snippets from the Tinker tab.
11. **Polish** (only if actually needed after using it): keyboard shortcuts beyond ⌘Enter, richer error states.

Main pane becomes a `Tabs` bar per product: Tinker | Artisan | Logs | Database.

Each milestone should be a working app, not a stub.
