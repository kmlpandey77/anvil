# Laravel Toolkit — Desktop App (Tinkerwell-alike)

Tauri + React + shadcn/ui desktop app for running PHP/Laravel snippets against real local projects.

## Scope (MVP, no more)

1. **Projects ("products")** — save a connection to a local Laravel app (path only). Switch between them. Run PHP code inside that project's booted context. ✅ shipped
2. **REPL / scratchpad** — write PHP, run it, see the result (value, echo/dump output, errors) inline. ✅ shipped
3. **Autocomplete** — as you type, suggest PHP keywords/built-in functions plus the connected project's own classes (`App\Models\User`, etc.), pulled from the real project, not a static guess. 🚧 in progress

Explicitly out of scope: SSH/remote/Docker connections, multi-environment products, XDebug, AI chat, log tailing, table mode, snippets library, themes, team/sharing, and any Laravel-version compatibility checker (dropped — not needed). Add later only if actually needed.

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
- Explicitly out of scope for this pass: member/method completion after `->` or `::` (would need real static analysis or an LSP — the natural upgrade path if this isn't enough later).

## Tech stack

- **Shell**: Tauri v2 (Rust backend, plain `std::process::Command` for spawning `php` — no shell plugin needed, we're not running arbitrary shell commands).
- **Frontend**: React + Vite + TypeScript + shadcn/ui + Tailwind v4.
- **Editor**: CodeMirror 6 (`@uiw/react-codemirror` + `@codemirror/lang-php` + `@codemirror/autocomplete`).
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
4. 🚧 **Autocomplete**: `list_symbols` Rust command (PSR-4 class walk + built-in functions) + CodeMirror completion source. See above for the design.
5. **Polish** (only if actually needed after using it): multiple tabs per product, keyboard shortcuts beyond ⌘Enter, richer error states.

Each milestone should be a working app, not a stub.
