# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Tauri v2 + React + TypeScript desktop app (Tinkerwell-alike) for running PHP/Laravel snippets against real local Laravel projects — a REPL ("Tinker"), an Artisan command runner, a log viewer, and a `.env` editor, all scoped per saved project ("product"). See `PLAN.md` for the full running design log (why each piece works the way it does, what was tried and reverted, and what's explicitly out of scope) — read it before making non-trivial changes; this file only covers what's needed to start working.

## Commands

Frontend (run from repo root):
- `pnpm install` — install JS deps
- `pnpm dev` — Vite dev server only (no Tauri window; useful for quick UI iteration, but `invoke()` calls to Rust commands will fail without a Tauri runtime)
- `pnpm exec tsc --noEmit` — typecheck
- `pnpm build` — typecheck + production frontend build (`tsc && vite build`)
- `pnpm tauri dev` — run the actual desktop app (Rust + webview)
- `pnpm tauri build` — build the installable desktop app

Backend (run from `src-tauri/`):
- `cargo check` — fast compile check
- `cargo test` — run all Rust unit tests
- `cargo test <name>` — run a single test by (partial) name match

There is no configured linter (no ESLint) and no frontend test runner — don't invent commands for either.

Adding shadcn/ui components: `pnpm dlx shadcn@latest add <component> -y -c <absolute-repo-path>` — pass `-c` explicitly if the shell's cwd might not be the repo root, and network access to `ui.shadcn.com` is required (may need to run outside the sandbox in this environment).

## Architecture

### Core mechanic: shell out to the project's own PHP

There is no embedded PHP engine and no bundled Laravel. Every "run" feature works by having Rust (`src-tauri/src/lib.rs`) spawn the *target project's own* `php` binary via `std::process::Command` — the same approach `php artisan tinker` uses under the hood:

- **Tinker** (`run_snippet`): writes a temp PHP file that requires `vendor/autoload.php`, boots the Kernel from `bootstrap/app.php`, then runs the snippet. Single-expression snippets (no `;`/newline, e.g. `User::count()`) get auto-wrapped in `dump()` via `wrap_snippet` (unit-tested) so they print without an explicit `dump()`/`echo`.
- **Autocomplete** (`list_symbols`, `list_members`): a *lighter* bootstrap — just `require vendor/autoload.php` — is enough for PSR-4 class discovery and `ReflectionClass`, without booting the full app or touching the DB.
- **Artisan** (`list_artisan_commands`, `run_artisan_command`): runs the project's real `artisan` binary directly.
- **`.env` editor** (`read_env`/`write_env`) and **log tailing** (`read_log_tail`) are the two features that do *not* shell out to PHP — plain `std::fs` read/write/seek.

A "product" is just `{ id, name, path, php_binary }`, persisted as `products.json` in the Tauri app-data dir (`serde_json`, pretty-printed, no database). `snippets.json` (saved Tinker snippets) follows the identical read-whole-file/write-whole-file pattern, keyed by `product_id`.

### Two recurring gotchas worth knowing before touching PHP-script-generating code

1. **PHP notices/deprecation warnings can print to stdout and corrupt JSON.** Any command that JSON-decodes a generated PHP script's stdout (`list_symbols`, `list_members`) wraps the script body in `ob_start()` / `ob_end_clean()` and echoes only the final buffer — otherwise a stray warning from autoloading a real project lands before the JSON and breaks `serde_json::from_str`. Apply the same pattern to any new command that needs structured (not free-form) stdout from a generated script.
2. **String interpolation into generated PHP uses Rust's `{:?}` (Debug) formatting**, e.g. `format!("require {:?};", path)` — this happens to produce valid escaped PHP double-quoted string literals for typical paths. Keep using this trick rather than hand-rolling escaping.

### Frontend structure

- `src/App.tsx` switches between two top-level screens based on whether a product is selected: `ProjectsHome` (landing page, card grid + "add project") and `ProductWorkspace` (once a product is selected).
- `ProductWorkspace` renders a `WorkspaceNav` (icon-only left rail: Tinker/Artisan/Logs/.env + Settings) and conditionally renders the active section's component — plain conditional rendering, not `Tabs`, so switching sections unmounts the inactive one (matters for `LogViewer`, which polls on an interval only while mounted).
- Tinker and Artisan both use a two-column layout (input/code on the left, `RunResultPanel` on the right).
- `RunResultPanel` has a `renderHtml` prop: Tinker passes it (Laravel's `dump()`/`dd()` output is forced into Symfony VarDumper's HTML format via `VAR_DUMPER_FORMAT=html` in `exec_php`, then rendered in a sandboxed `<iframe sandbox="allow-scripts">` for the real collapsible-tree look). Artisan does **not** — command output can contain literal `<...>` placeholders (e.g. `route:list`) that would be misinterpreted as HTML.
- Editor is Monaco (`@monaco-editor/react`), **self-hosted** (not the default CDN loader — this is an offline desktop app) via `src/lib/monaco-setup.ts`, which also registers a custom PHP tokenizer: Monaco's *built-in* `php` language expects an HTML file with a `<?php` tag and never colors bare-PHP snippets without one, so `monaco-setup.ts` re-registers `php` using Monaco's own `phpRoot` tokenizer state directly as the entry point.
- PHP completion (keywords/functions/classes/members) is registered globally per-language via `monaco.languages.registerCompletionItemProvider('php', ...)` in `src/lib/symbols.ts`, not per-editor-instance — components that use it must dispose the previous registration when the product or its symbol set changes (see the `useEffect` cleanup pattern in `src/components/snippet-runner.tsx`).
- Editor font size/family and theme (light/dark/system via `next-themes`) are per-viewer preferences in `localStorage` (`src/lib/settings.ts`), not part of the Rust-backed product/snippet data.

### Verifying changes without a display

This sandbox has no window system to run the actual Tauri app in. The established pattern for verifying frontend changes (see `PLAN.md` for examples) is a temporary, git-ignored test harness: a `test-app.html` + `src/test-app-main.tsx` that mocks `window.__TAURI_INTERNALS__.invoke` with canned responses, served via `pnpm exec vite --port <port>` and driven with the `claude-in-chrome` browser tools — then deleted once verified. Never commit these files.
