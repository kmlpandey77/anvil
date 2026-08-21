---
name: Anvil
description: A violet-and-orange debug console pinned to Ray by Spatie's real visual language
colors:
  violet-ink: "oklch(0.16 0.032 296)"
  violet-paper: "oklch(0.975 0.012 296)"
  violet-card: "oklch(0.21 0.04 296)"
  violet-card-light: "oklch(0.995 0.003 296)"
  violet-popover: "oklch(0.24 0.044 296)"
  ray-orange: "oklch(0.72 0.19 42)"
  ray-orange-light: "oklch(0.64 0.19 41)"
  ember-red: "oklch(0.66 0.22 21)"
  violet-border: "oklch(1 0 0 / 10%)"
  violet-muted: "oklch(0.7 0.035 296)"
typography:
  title:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: "1.375"
  body:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5"
  label:
    fontFamily: "ui-monospace, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1.4"
rounded:
  sm: "9.6px"
  md: "12.8px"
  lg: "16px"
  xl: "22.4px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ray-orange}"
    textColor: "{colors.violet-ink}"
    rounded: "{rounded.lg}"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.violet-card}"
    textColor: "{colors.violet-paper}"
    rounded: "{rounded.lg}"
    height: "32px"
  button-destructive:
    backgroundColor: "color-mix(in oklch, {colors.ember-red}, transparent 85%)"
    textColor: "{colors.ember-red}"
    rounded: "{rounded.lg}"
    height: "32px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.violet-paper}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.violet-card}"
    textColor: "{colors.violet-paper}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: Anvil

## Overview

**Creative North Star: "The Ray Console"**

Pinned by explicit user reference to [Ray](https://myray.app), Spatie's Laravel debug-output desktop app — the closest possible analog to this app's own `dd()`/`dump()` output, built by one of the most respected Laravel package authors. Verified against Ray's live marketing site and its real in-app dump feed (screenshot-sampled directly, not recalled from memory) before writing a single token here. Replaces "The Bare Terminal," the previous pure-grayscale-shadcn-defaults system, in full.

The world: a deep violet ground carries the whole interface — not pure black, a real hue — with **one** vivid orange accent doing every job color does in this app: primary actions, focus rings, the active nav icon, the run-status dot mid-execution. Cards and floating surfaces get a genuine offset-blur shadow tinted to the same violet hue, replacing the old system's flat 1px-ring-only elevation. Geist Variable stays as the UI typeface — Ray's real face, "PT Root UI," is a commercial ParaType font with no legally self-hostable source available here, so this is the closest obtainable face, not a drift from the reference.

**Key Characteristics:**
- Violet is the new neutral: page, card, and popover form a three-tier ground (darkest → card → popover), all one hue family, never pure gray.
- Orange is the single accent, spent on primary actions, focus, and the one thing that's "live" on any given screen — never decoration.
- Real shadows (offset + blur, violet-tinted) on cards, popovers, and dropdowns; modals stay ring-only, depth from their dimmed backdrop instead — the one elevation distinction carried over unchanged from the previous system.
- A colored status dot (idle/running/success/error) on Tinker and Artisan — a direct, deliberate borrow from Ray's own dot-per-log-entry motif.

## Colors

Two families: a violet ground (the new neutral, replacing pure grayscale) and one vivid orange accent. Destructive red is pushed toward true crimson (hue 21) specifically to stay unambiguous next to the orange accent (hue 42) — close enough in the same warm family to feel related, far enough apart that "delete" never reads as "primary action."

### Primary — the accent
- **Ray Orange** (`oklch(0.72 0.19 42)` dark / `oklch(0.64 0.19 41)` light): every primary button, every focus ring, the active nav icon's fill, the running-state status dot. Nothing else in the system earns this color. Text on it is near-black violet-ink, not white — at this lightness/chroma the dark-on-orange pairing reads noticeably crisper than white-on-orange while still holding well past AA contrast.

### Neutral — the violet ground
- **Violet Ink** (`oklch(0.16 0.032 296)`, dark background): the deepest layer — page background in dark mode, and the text color on top of the orange accent in both modes.
- **Violet Paper** (`oklch(0.975 0.012 296)`, light background) / **Violet Card** (`oklch(0.995 0.003 296)`): light mode's page and card grounds — barely-tinted, not pure white, so the world stays recognizable with the theme flipped.
- **Violet Card** (`oklch(0.21 0.04 296)`, dark): one step up from the page — every card, every panel surface.
- **Violet Popover** (`oklch(0.24 0.044 296)`, dark): one step up again — dropdowns, popovers, tooltips; the lightest of the three ground tiers.
- **Violet Muted** (`oklch(0.7 0.035 296)` dark / `oklch(0.48 0.035 296)` light): secondary text — descriptions, placeholders, timestamps.
- **Violet Border** (`oklch(1 0 0 / 10%)` dark / `oklch(0.9 0.018 296)` light): hairlines throughout.

### The One Accent Rule
Orange means exactly one thing: this is the live, actionable thing on this screen. It never doubles as a status color, a link color, or decoration — a second color competing for that same "look here" signal would defeat the point of having only one.

## Typography

**UI Font:** Geist Variable — unchanged from the previous system, and a deliberate adaptation: Ray's real UI face is "PT Root UI," a commercial ParaType typeface with no legal self-hostable source available in this build. Geist is the closest obtainable humanist sans, not a drift from the pinned reference.
**Code/Label Font:** unchanged, `ui-monospace, Menlo, Consolas, monospace` — code, paths, log lines, command names.

Hierarchy, roles, and sizing are unchanged from the previous system (Title 16px/500, Body 14px/400, Label/Mono 12px) — this redesign is a material and color change, not a type-scale change.

## Layout

Unchanged from the previous system — this redesign is scoped to visuals (color, elevation, shape, chrome), not structure. Landing page card grid, icon-only workspace nav rail, and the Tinker/Artisan two-column split all keep their exact composition; see git history for the original layout documentation if needed.

## Elevation & Depth

The system's biggest material change. The previous system was flat by design (a 1px ring, never a shadow, anywhere). This world uses real shadows: cards, popovers, and select dropdowns carry an offset, blurred, violet-hue-matched shadow (`--shadow-ambient` / `--shadow-ambient-lg` in `index.css`) instead of a flat ring — genuine depth, not a hairline outline standing in for it.

**Modals kept their old treatment on purpose.** Dialog and AlertDialog still use a ring, not a shadow — their depth cue is the dimmed backdrop behind them, which already does the job a shadow would. This is the one elevation rule carried over unchanged, because it was correct before and stays correct here.

### Shadow Vocabulary
- **Ambient** (`--shadow-ambient`): cards, popovers, select dropdowns. A soft, offset, violet-tinted shadow — `0 10px 28px -8px oklch(0.05 0.03 296 / 0.55), 0 2px 10px -3px oklch(0.05 0.03 296 / 0.4)` in dark mode, lighter and less opaque in light mode.
- **Ambient Large** (`--shadow-ambient-lg`): reserved for anything that needs to read as sitting well above the page — not yet used by an existing component, available for a future large floating surface.
- **Modal ring** (`ring-1 ring-foreground/10`, no shadow): Dialog, AlertDialog — depth from the dimmed backdrop, not the panel.

### Named Rules
**The Real Depth Rule.** A surface that sits in normal page flow and needs to read as "above" its neighbors gets an actual offset-blur shadow now, not a ring pretending to be one. A modal still doesn't need one — its backdrop already does that job — so modals are the one place a ring alone remains correct.

## Shapes

Radius grew softer across the board: base radius moved from 10px to 16px (`--radius: 0.875rem`), scaling the existing sm/md/lg/xl steps up with it (≈9.6 / 12.8 / 16 / 22.4px). A `full` (9999px) pill radius joins the scale for the first time, used by the scrollbar thumb. Borders stay 1px hairlines — the softer corners carry the "modern" read, not thicker strokes.

## Components

Buttons, inputs, cards, dropdowns, popovers, modals, scroll areas, the icon nav rail, and the two Result Panel variants (plain for Artisan, rich sandboxed-iframe for Tinker) are structurally unchanged from the previous system — same shapes, same states, same behavior. What changed is the palette flowing through them (violet ground, orange accent) and elevation (real shadow on card/popover/select, ring-only kept on modals). Two things are genuinely new:

### Status Dot (signature component)
A small (6px) filled circle next to the Run button on Tinker and Artisan, reflecting the run that's already tracked in state — idle (muted violet), running (pulsing orange), success (green), error (red/destructive). A direct, deliberate borrow from Ray's own real in-app dump feed, where every log entry carries a colored status dot. Purely a new *rendering* of existing state — introduces no new behavior.

### Editor Chrome (Monaco)
The code editor (Tinker, `.env`) now runs two custom Monaco themes, `ray-dark` / `ray-light` (`src/lib/monaco-setup.ts`), instead of Monaco's stock `vs`/`vs-dark`. Only editor *chrome* is retheme — background, line numbers, cursor (orange), selection, suggest-widget — token/syntax colors are left inherited from the base theme, since Monaco's defaults already read cleanly against the new violet background.

## Do's and Don'ts

### Do:
- **Do** spend orange only on the one live/primary/actionable thing per screen (The One Accent Rule).
- **Do** give any new in-flow surface (a card, a panel) a real offset-blur shadow from `--shadow-ambient`, not a flat ring (The Real Depth Rule).
- **Do** keep modals ring-only — their backdrop is already their depth cue.
- **Do** use the softer 16px-base radius scale for new surfaces; a 10px-feeling corner will look like it belongs to the old system.
- **Do** switch to the monospace stack for code-like content and keep everything else in Geist Variable.

### Don't:
- **Don't** introduce a second accent color — orange's whole job depends on there being exactly one.
- **Don't** give a modal a shadow; that's the one surface this world deliberately keeps flat.
- **Don't** render Artisan (or any command-output) stdout as HTML — only Tinker's dump output is sandboxed and safe to interpret as markup.
- **Don't** reach for pure black/white/gray anywhere — every neutral in this system carries the violet hue, even at near-black or near-white lightness.
- **Don't** design for phone/tablet breakpoints — this is a native desktop window, not a public site.
