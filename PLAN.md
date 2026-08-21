# Anvil — Desktop App (Tinkerwell-alike)

Formerly "Laravel Toolkit" — renamed to Anvil (see PRODUCT.md's Brand Commitments and milestone 15 below).

Tauri + React + shadcn/ui desktop app for running PHP/Laravel snippets against real local projects.

## Scope (MVP, no more)

1. **Projects ("products")** — save a connection to a local Laravel app (path only). Switch between them. Run PHP code inside that project's booted context. ✅ shipped
2. **REPL / scratchpad** — write PHP, run it, see the result (value, echo/dump output, errors) inline. ✅ shipped
3. **Autocomplete** — as you type, suggest PHP keywords/built-in functions plus the connected project's own classes (`App\Models\User`, etc.), pulled from the real project, not a static guess. ✅ shipped
4. **Member completion** — after `Class::` or `$var->` (where `$var` was assigned via `$var = new Class(`), suggest real public methods/properties via PHP reflection, plus `@property`/`@method` docblock tags (picked up automatically if the project has run `php artisan ide-helper:models` — no dependency on the package itself, just its output format). ✅ shipped

5. **Artisan runner** — list the project's real `artisan` commands and run one, output shown the same way as a snippet. ✅ shipped
6. **Log tailing** — poll `storage/logs/*.log` and show the tail, while the Logs section is open. ✅ shipped
7. **Snippet history** — save/load/delete named snippets per product. ✅ shipped

A DB/table browser (`run_query`, `DB::select`) shipped and was then **removed** on request — not a fit for the product's direction. If it comes back, the design (bootstrap the Kernel like `run_snippet`, `serde_json`'s `preserve_order` feature for column ordering, guard SQL to `select`-only) is preserved in git history (the commit that added it, and the one that removed it).

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

### Artisan runner, log tailing, snippet history — shipped

- `list_artisan_commands`/`run_artisan_command`: shell out to the project's own `artisan` (`list --format=json` is Symfony Console's built-in JSON descriptor, verified against a real `symfony/console` app before trusting the shape). `run_artisan_command` takes freeform args (split on whitespace client-side).
- `read_log_tail`: picks the most recently modified `*.log` in `storage/logs` (default single file or the "daily" driver's rotated files), seeks to the last 100KB rather than loading the whole file. Frontend polls every 2s while the Logs section is mounted (conditionally rendered in `product-workspace.tsx`, so switching sections unmounts it and polling stops on its own).
- Snippet history: `snippets.json` in the app data dir, same read/write-whole-file pattern as `products.json` — `list_snippets`/`save_snippet`/`delete_snippet`, filtered by `product_id`. A popover on the Tinker section (`SnippetHistory`) lists saved snippets for the current product, loads one into the editor on click, and can save the current buffer under a name.

### Navigation redesign — shipped

Replaced the always-visible product-list sidebar + `Tabs` bar with two distinct screens:

- **Landing page** (`ProjectsHome`, shown when no product is selected): a card grid of every saved product plus an "Add new project" card (reuses `AddProductDialog` with a custom `trigger` prop instead of its default button).
- **Workspace** (`ProductWorkspace`, shown once a product is selected): a `w-14` icon-only nav rail (`WorkspaceNav`) — back-to-projects arrow, Tinker/Artisan/Logs icons, Settings at the bottom — next to the active section's content. Sections are plain conditional rendering (`section === 'tinker' && <SnippetRunner />`), not `Tabs`, so switching sections unmounts the inactive one same as before.
- Tinker and Artisan both moved from a stacked (editor-on-top, output-below) layout to two columns side by side — `RunResultPanel` changed from `max-h-64` (bottom strip) to `h-full border-l` (right column) and now accepts `result: RunResult | null` directly, rendering a "Run to see output" placeholder instead of being conditionally omitted.
- Caught one real layout bug via a mocked-Tauri browser test before considering this done: `ProductWorkspace`'s root `<div>` had no `w-full`/`flex-1`, so as a flex item of `<main>` it shrank to fit its content instead of filling the screen — the whole workspace rendered in a ~380px strip with everything else black. One-line fix (`w-full` on the root div).

### Beautiful dd()-style output — shipped

Tinker's auto-wrap heuristic (`wrap_snippet`) switched from `var_dump()` to `dump()`, and `exec_php` now sets `VAR_DUMPER_FORMAT=html` when spawning `php`. Both dump() and Laravel's `dd()` are Symfony VarDumper under the hood (already a `laravel/framework` dependency, no new PHP package) — normally it picks the plain ANSI CLI dumper for a `php script.php` process, but that env var forces its HTML dumper instead: a self-contained `<pre class=sf-dump>` fragment with inline `<style>`/`<script>` for the collapsible tree, colors, everything `dd()` looks like on a web page.

Frontend renders Tinker's stdout in a sandboxed `<iframe sandbox="allow-scripts" srcDoc={...}>` (`RunResultPanel`'s new `renderHtml` prop) — fully isolated from the app's own DOM/CSS/JS, with `allow-scripts` (but not `allow-same-origin`) so the dumper's own collapse/expand toggle script still works without being able to touch the parent page. Plain `echo`'d text (non-dump output) renders fine too, since browsers handle bare text nodes in an HTML document without issue. Artisan's `RunResultPanel` does **not** pass `renderHtml` — command output (e.g. `route:list`) contains literal `<id>`-style placeholders that would get misinterpreted as HTML tags, so it stays plain `<pre>` text.

Verified the whole pipeline end to end before wiring up the frontend: confirmed `VAR_DUMPER_FORMAT=html` actually forces HTML output for a plain `php` CLI process (a standalone `symfony/var-dumper` fixture), then again through the full `bootstrap_header` + Kernel-boot path (a fake Laravel project fixture, same pattern used for `run_snippet` originally), then visually in a real browser against a captured real `dump()` HTML sample — including clicking the collapse/expand arrow to confirm the sandboxed script actually runs.

### .env editor — shipped

`read_env`/`write_env`: plain `fs::read_to_string`/`fs::write` against `{path}/.env` — no PHP execution involved at all (unlike almost everything else in this app), so the risk profile is low enough that it didn't need the fixture-based verification the PHP-script commands got. Missing `.env` (fresh checkout) reads as an empty string rather than erroring, so the editor just opens empty and Save creates the file — no separate "create" flow.

New "env" nav section (`EnvEditor`) — plain Monaco editor (`language="ini"`, close enough to `KEY=VALUE` + `#` comments for reasonable highlighting; Monaco has no dedicated dotenv mode), Save (⌘S) disabled until dirty, Reload discards local edits and re-fetches.

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
7. ✅ **Artisan runner**: `list_artisan_commands` (`php artisan list --format=json`) + `run_artisan_command`, a new "Artisan" section.
8. ✅ **Log tailing**: `read_log_tail` (find newest `storage/logs/*.log`, read its tail), frontend polls every ~2s while the Logs section is mounted.
9. ✅ **Snippet history**: `snippets.json` in the app data dir (same pattern as `products.json`), keyed by product — save/load/delete named snippets from the Tinker section.
10. ✅ **Navigation redesign**: card-grid landing page (`ProjectsHome`) + icon-only nav rail per selected product (`WorkspaceNav`: Tinker/Artisan/Logs), replacing the always-visible product sidebar + top `Tabs` bar. Tinker and Artisan restructured into two columns (code/input left, result right). DB/table browser removed.
11. ✅ **Beautiful dd()-style output**: `VAR_DUMPER_FORMAT=html` + `dump()` instead of `var_dump()`, rendered in a sandboxed iframe on the Tinker section only.
12. ✅ **.env editor**: `read_env`/`write_env` (plain file I/O, no PHP), new "env" nav section.
13. ✅ **Visual redesign — "The Ray Console"**: replaced the pure-grayscale shadcn-defaults look with a violet-ground + one-orange-accent system, pinned by explicit user reference to Ray (Spatie's Laravel debug-output app). Real offset-blur shadows on cards/popovers/dropdowns (modals kept ring-only on purpose), a softer 16px-base radius scale, custom Monaco themes matching the new ground, and a new status-dot component (idle/running/success/error) borrowed from Ray's own log-feed motif. Visuals only — zero behavior/layout changes, per explicit user constraint. Full rationale and token values in `DESIGN.md`.
14. ✅ **Naming**: "Laravel Toolkit" (placeholder) → **Anvil**, confirmed from a curated shortlist (Lantern/Anvil/Beacon) tied to the Ray Console visual world and Laravel's own "artisan" language. Updated everywhere the app presents itself to a user — window title, page title, landing header, docs — deliberately left the npm package slug, Cargo crate name, Tauri bundle identifier (`com.laraveltoolkit.app`), and the repo directory name untouched: internal/OS-level identifiers, not what a user sees, not worth the risk for zero visible benefit. App icon still the Tauri default — undecided.
15. ✅ **App icon**: hand-authored SVG anvil mark (horn/face/waist/base, built from overlapping primitives) in Ray Orange on a Violet Ink rounded-square ground, using the exact `DESIGN.md` oklch tokens converted to hex. Rasterized to a 1024px master and run through `pnpm tauri icon` to regenerate the full `src-tauri/icons/` set (32/128/128@2x/icns/ico + Windows Store tiles); iOS/Android assets the tool also generates were discarded since this project has no mobile targets. **Replaced** with a user-supplied illustration (blacksmith forging on an anvil) — the full piece was illegible at 32px, so it's cropped tight to just the anvil/glowing bar/sparks, which reads cleanly at both 32px and 128px+. Re-ran through the same `pnpm tauri icon` pipeline.
16. ✅ **Auto-update**: `tauri-plugin-updater` + `tauri-plugin-process`, checks GitHub Releases (`github.com/kmlpandey77/anvil`, public — private repos can't serve release assets to an unauthenticated updater request) on launch, prompts via a Sonner toast with an "Install & restart" action rather than updating silently. Signed with a dedicated Ed25519 keypair generated via `pnpm tauri signer generate` (private key kept outside the repo at `~/.tauri/anvil.key`, empty passphrase inlined directly in the workflow rather than as a secret, since GitHub's secret UI rejects an empty value; public key embedded in `tauri.conf.json`). `.github/workflows/release.yml` builds/signs/publishes a draft release on `v*` tag push via `tauri-apps/tauri-action`, Linux-only for now (macOS/Windows dropped from the matrix — not needed yet, added cost to every run); needs `TAURI_SIGNING_PRIVATE_KEY` set as a repo secret before tagging.
17. ✅ **About section**: `get_app_stats` Rust command (via `sysinfo`) reports app version, app-data directory size, and current process RAM. Split into its own `AboutDialog` + nav-rail trigger, separate from `SettingsDialog` (theme/editor font) — same "one icon-triggered dialog per concern" pattern as Settings.
18. ✅ **Polish**: Artisan was the one section missing a run shortcut (Tinker had ⌘Enter, `.env` had ⌘S) — selecting a command now focuses the args field and Enter runs it. Audited error states across the app; found nothing that needed richer handling (inline validation on Add Product, red stderr panel, toasts with real Rust error text already cover it) — no changes made there.

Each milestone should be a working app, not a stub.
