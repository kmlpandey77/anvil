# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The developer building this app — a solo Laravel/PHP developer using it for their own local development workflow. Not designed for other users yet; no team or public audience to account for.

## Product Purpose

A desktop tool for rapid PHP/Laravel prototyping and debugging: run PHP snippets, Artisan commands, and view logs against a real, already-configured local Laravel project, without leaving a dedicated app or reaching for `php artisan tinker` in a terminal.

## Positioning

A free, fully local alternative to Tinkerwell (the paid commercial equivalent). Same core value — run code against a real booted Laravel app, with autocomplete and Artisan/log tooling — with no subscription, no account, and no cloud dependency. Everything runs by shelling out to the target project's own `php`/`artisan` binaries; there is no embedded PHP engine and no bundled Laravel.

## Operating Context

A Tauri v2 desktop app (Rust backend + React/TypeScript webview), not a browser-hosted website — design and interaction should assume native window chrome, local window resizing, and no responsive/mobile breakpoints, rather than public-web patterns.

Used alongside a terminal and IDE during local Laravel development. The user adds a "product" (a saved connection: name, local filesystem path, PHP binary) pointing at an existing Laravel project already checked out and configured (`composer install` run, `.env` present or not) on their machine — the app does not create or scaffold projects.

## Capabilities and Constraints

- Single-user, fully local. No accounts; the only network calls are an optional shadcn/ui component-registry fetch during development and a startup check against GitHub Releases for app updates.
- No SSH/remote projects, no Docker/Sail-specific handling, no XDebug/step-debugging, no AI features, no team or multi-user support, no database/SQL browser (built once, then deliberately removed).
- Current feature set: Tinker (PHP REPL with autocomplete, member completion, and dd()-style rich output), Artisan command runner, log tailing, `.env` editor, snippet history, per-viewer settings (theme, editor font), auto-update (checks GitHub Releases on launch, user-confirmed install + restart).
- App icon matches the app's visual identity (custom anvil mark, see Brand Commitments).

## Brand Commitments

Name: **Anvil** — confirmed, replacing the "Laravel Toolkit" placeholder. Chosen from a curated shortlist (Lantern, Anvil, Beacon) tied to the app's visual world ("The Ray Console" — warm accent, workshop-plain) and Laravel's own "artisan" CLI language: an anvil is where a craftsman shapes things, solid and workshop-coded rather than precious. App icon is a custom anvil silhouette (horn, face, waist, base) in Ray Orange on a Violet Ink rounded-square ground, built from the same design tokens as the rest of the UI (`src-tauri/icons/`).

## Product Principles

- Reuse the real project, never simulate it: every "run" feature shells out to the target project's own PHP/Artisan binaries and reads its real files (logs, `.env`) — no embedded engine, no guessed behavior.
- Local-first and free: no subscription, no account, no cloud dependency, as the explicit alternative to a paid commercial tool.
- Personal tool, not a product: build for one user's own workflow; do not add scope (multi-user, team features, distribution polish) ahead of an actual need.
- Ship features complete, not stubbed: each addition should work end-to-end before moving to the next, matching the milestone-by-milestone history in `PLAN.md`.
