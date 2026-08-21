---
name: Laravel Toolkit
description: A bare, monochrome desktop tool for running PHP against real local Laravel projects
colors:
  ink: "oklch(0.205 0 0)"
  ink-foreground: "oklch(0.985 0 0)"
  paper: "oklch(1 0 0)"
  paper-foreground: "oklch(0.145 0 0)"
  fog: "oklch(0.97 0 0)"
  fog-foreground: "oklch(0.205 0 0)"
  slate: "oklch(0.556 0 0)"
  hairline: "oklch(0.922 0 0)"
  steel: "oklch(0.708 0 0)"
  signal-red: "oklch(0.577 0.245 27.325)"
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
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper-foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
  button-destructive:
    backgroundColor: "color-mix(in oklch, {colors.signal-red}, transparent 90%)"
    textColor: "{colors.signal-red}"
    rounded: "{rounded.lg}"
    height: "32px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.paper-foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-foreground}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: Laravel Toolkit

## Overview

**Creative North Star: "The Bare Terminal"**

No accent color has been chosen. This is deliberate, not unfinished: the interface is a monochrome instrument for reading PHP output and moving between a handful of tools, and any color would compete with the one thing that actually needs it — the syntax-highlighted editor and the `dd()`-style dump output at the center of the screen. The system runs on shadcn/ui's stock "Nova" style with a neutral base color, unmodified. That is itself the choice: reach for a customized palette only when a real reason to differentiate shows up, not by default.

Density is tight and utilitarian — an icon-only 56px nav rail, 32px controls, 12–14px text almost everywhere. Surfaces sit flat at rest; the only depth cue is a 1px ring, reserved for transient overlays (see Elevation & Depth). The one spot of intentional color in the entire system is destructive red, and it appears only on actions that delete something.

**Key Characteristics:**
- Fully achromatic outside destructive red — no brand color exists yet.
- One typeface (Geist Variable) for every UI role; monospace only for code, paths, and command/log output.
- Flat by default; shadow is reserved for things that float above the page, never for things that sit on it.
- Small, dense controls (32px buttons/inputs) sized for a desktop tool, not a touch surface.

## Colors

Entirely grayscale except one deliberate red. Every gray is `oklch` with zero chroma — pure lightness steps, no hue.

### Primary
- **Ink** (`oklch(0.205 0 0)`): the default button background and the bright/primary color in dark mode. Near-black in light mode, near-white in dark mode — it inverts with the theme rather than staying fixed.
- **Ink Foreground** (`oklch(0.985 0 0)`): text/icon color on top of Ink.

### Neutral
- **Paper** (`oklch(1 0 0)`): page and card background in light mode.
- **Paper Foreground** (`oklch(0.145 0 0)`): default body text in light mode.
- **Fog** (`oklch(0.97 0 0)`): secondary/muted/accent surface — hover states, the muted panel behind result output, disabled fills.
- **Slate** (`oklch(0.556 0 0)`): muted/secondary text — descriptions, placeholders, timestamps, file paths.
- **Hairline** (`oklch(0.922 0 0)`): borders and input outlines.
- **Steel** (`oklch(0.708 0 0)`): focus ring color.

### The One Color Rule
**Signal Red** (`oklch(0.577 0.245 27.325)`) is the only chromatic color anywhere in the system, and it means exactly one thing: destructive. It appears solely on the destructive button variant and delete affordances (remove a saved product, delete a snippet). Nothing else — not a status, not an accent, not a link — may use it. Its rarity is what makes it legible as a warning.

Dark mode inverts lightness (Paper becomes near-black, Ink becomes near-white) rather than remapping hue — because there is no hue to remap. Destructive red also softens in dark mode (`oklch(0.704 0.191 22.216)`, lighter and less saturated) to stay legible on a dark ground without glowing.

## Typography

**UI Font:** Geist Variable, with a `sans-serif` fallback — the only typeface in the system. There is no separate display or heading face; `--font-heading` resolves to the same family as `--font-sans`, so hierarchy comes from weight and size, not a font change.
**Code/Label Font:** `ui-monospace, Menlo, Consolas, monospace` — used wherever content is code-like: PHP output, file paths, log lines, Artisan command names, saved-snippet code. Not a token in the CSS theme; it's the browser/OS monospace stack, applied directly with `font-mono`.

**Character:** Plain and dense. There is no display or headline size anywhere in the app — the largest text is a 16px card title. Everything else sits between 12 and 14px, sized for scanning tool output, not for making a statement.

### Hierarchy
- **Title** (500 weight, 16px / 14px on compact cards, 1.375 line-height): card titles and the product-name header at the top of a workspace. The only place text goes above body size.
- **Body** (400 weight, 14px, 1.5 line-height): the default for almost everything — labels, buttons, list items, form fields.
- **Label / Mono** (400 weight, 12px, `font-mono`): the densest tier — result panels, log lines, saved-snippet names, file paths, Artisan command descriptions. This is where most of the screen's actual content lives.

### Named Rules
**The One Face Rule.** Every UI role uses Geist Variable. The only typeface switch in the whole app is UI → monospace, and it switches for a reason (this is code / this is a path), never for decoration.

## Layout

No responsive breakpoints — this is a desktop window, not a public webpage; layout targets window resizing, not phone/tablet/desktop tiers.

Two distinct shells:
- **Landing** (`ProjectsHome`): a centered, `max-w-4xl` column holding a `grid-cols-2`/`grid-cols-3` card grid of saved projects plus an "Add new project" card in dashed-border ghost style.
- **Workspace** (`ProductWorkspace`): a fixed 56px (`w-14`) icon-only nav rail on the left (`WorkspaceNav`), full-height, holding a back arrow, the section icons (Tinker/Artisan/Logs/.env), and Settings pinned to the bottom. The remaining width is the active section.

### Named Rules
**The Two-Column Rule.** Tinker and Artisan — the two sections with both an input and an output — split their content area exactly in half: input/code on the left, result on the right, full height, divided by a hairline (`border-l`). Landing's card grid and the icon rail are the only other layout patterns; nothing else invents a third.

## Elevation & Depth

Flat by default. Cards and buttons carry a **1px ring** (`ring-1 ring-foreground/10`), not a shadow — a hairline outline, not a light source. `box-shadow` (`shadow-md`) is reserved for exactly one class of surface: an **anchored floating menu** — popover, select dropdown — that appears next to the control that opened it, with nothing behind it to explain its depth. A **modal** (Dialog, AlertDialog) gets the *same* ring-only treatment as a card, not a shadow: its depth cue is the dimmed backdrop behind it, not the surface itself. The distinction is anchored-menu vs. modal, not "floats vs. doesn't."

### Shadow Vocabulary
- **Anchored menu** (`shadow-md` + `ring-1 ring-foreground/10`): popovers, select dropdowns. The only surfaces that carry an actual shadow.
- **Modal** (`ring-1 ring-foreground/10` only, no shadow): Dialog, AlertDialog. Depth comes from the dimmed overlay behind it (`bg-black/10` + backdrop blur), not from the panel itself.

### Named Rules
**The Grounded Rule.** A surface in the page's normal flow stays flat — a ring, never a shadow. An anchored menu (popover, select) earns a shadow because it has nothing behind it to read as "above" the page. A modal doesn't need one: the dimmed backdrop already does that job, so the panel itself stays ring-only, same as a card. A card — or a modal — growing a shadow would be the single fastest way to break this system's logic.

## Shapes

Radius is generous but not soft — a working desktop tool, not a rounded consumer app. Base radius is 10px (`--radius: 0.625rem`), scaled up and down from there: 6px (small controls like compact icon buttons), 8px, 10px (default — buttons, inputs, popovers, dropdowns), 14px (cards), up to 18–26px for anything larger that doesn't currently exist in the app. Borders are 1px hairlines throughout; nothing uses a heavier stroke.

## Components

### Buttons
- **Shape:** 10px radius (`rounded-lg`), 32px height by default, 24–28px for `xs`/`sm`, 36px for `lg`.
- **Primary** (`default` variant): Ink background, Ink Foreground text; hovers to 80% opacity rather than a different shade.
- **Outline:** Paper background, hairline border, fills to Fog on hover.
- **Ghost:** transparent until hover, then fills to Fog. Used for icon-only actions (nav rail, settings, delete-row triggers that only appear on row hover).
- **Secondary:** Fog background; hover mixes 5% of the foreground color into it rather than jumping to a fixed shade — a subtler hover than Outline's.
- **Destructive:** Signal Red at 10% opacity as background, full Signal Red as text — never a solid red fill. Reserved for delete actions.
- **Link:** underline-on-hover only, Ink-colored text, no background at any state.

### Cards
- **Corner style:** 14px radius (`rounded-xl`).
- **Background:** Paper.
- **Shadow strategy:** none — 1px ring only (see Elevation & Depth).
- **Border:** the ring itself is the only border; no separate stroke.
- **Internal padding:** 16px default, 12px on the `sm` size variant.

### Inputs / Fields
- **Style:** transparent background, hairline border, 10px radius, 32px height.
- **Focus:** border shifts to Steel (the ring color) and gains a 3px, 50%-opacity ring around it — a glow, not just a border change.
- **Error:** border and ring shift to Signal Red at the same weight as the focus treatment, so error state reads as "focus went wrong" rather than a separate visual language.
- **Disabled:** 50% opacity, background fills faintly with the input tone.

### Field Labels
- **Style:** 14px, medium weight, sits directly above its field with no visible gap treatment beyond the standard form stack spacing. Dims to 50% opacity and blocks pointer events when its field is disabled (`peer-disabled`) — the label physically reacts to the field's state rather than staying static.

### Dropdowns (Select)
- **Trigger:** matches Input exactly — same height, radius, border, focus ring — so a select reads as "a field," not a distinct control type.
- **Menu:** Fog-adjacent popover surface (`bg-popover`), 10px radius, `shadow-md` + 1px ring (an anchored menu — see Elevation & Depth), scroll up/down chevrons instead of clipping.
- **Item:** highlights to Fog on hover/keyboard-focus; no checkmark column reserved when unselected, so the list doesn't visually shift between selected and unselected states.

### Floating Menus (Popover)
- **Style:** same anchored-menu treatment as Select's dropdown — `shadow-md` + 1px ring, 10px radius, `w-72` default width. Used for the snippet-history list (save/load/delete saved Tinker snippets) — the one place a popover carries a small form (name input + save button) rather than just a list.

### Modals (Dialog / Alert Dialog)
- **Style:** centered, 14px radius (`rounded-xl`), 1px ring — **not** a shadow (see The Grounded Rule). Backdrop is a light `bg-black/10` blur, not a heavy scrim; the interface stays legible behind it.
- **Alert Dialog** (destructive confirmations only, e.g. "Remove 'cci-backend'?"): Cancel renders as Outline, the confirming action as the button's own variant (destructive red for a delete) — the two actions are visually unequal on purpose, so the destructive one doesn't read as the safe default.
- **Dialog** (forms — add project, settings): same shell, holds a form instead of a confirmation; closes via an explicit `X` in the corner as well as the standard escape/backdrop-click affordances.

### Scroll Areas
- **Style:** Radix scroll area with a custom 10px-wide thumb-only scrollbar (`bg-border`, `rounded-full`, no visible track) — used for the Artisan command list and the snippet-history list, anywhere a list can outgrow its container.

### Navigation (icon rail)
- **Style:** 56px-wide vertical rail, icon-only 36px (`size-9`) ghost buttons, no labels — meaning is carried by icon + a native `title` tooltip, not text.
- **Active state:** Fog background fill on the active section's icon; no color change, no indicator bar.
- **Fixed anchors:** back-to-projects arrow pinned at the top, Settings pinned at the bottom; the section icons fill the middle and grow only as new sections are added.

### Result Panel (signature component)
The right-hand column in Tinker and Artisan. Two registered variants:
- **Plain** (Artisan): `font-mono text-xs` inside a `bg-muted/30` panel, divided from the input column by a hairline. Never HTML-interpreted — Artisan output (e.g. route lists) can contain literal `<...>` text that must render as text, not markup.
- **Rich** (Tinker only): the same panel, but stdout renders inside a sandboxed `<iframe sandbox="allow-scripts">` so Laravel's `dd()`/`dump()` output (forced into Symfony VarDumper's HTML format) renders as its real collapsible, colored tree — the one place in the app where color and depth genuinely diverge from the rest of the system, because it's the real output of the user's own code, not app chrome.

## Do's and Don'ts

### Do:
- **Do** keep every new UI surface achromatic (Paper/Ink/Fog/Slate/Hairline/Steel) unless a deliberate decision introduces a real accent color — see Overview.
- **Do** use a 1px ring for any surface that sits in normal page flow, and reserve `shadow-md` for content that floats above it and can be dismissed (The Grounded Rule).
- **Do** keep new "result"-shaped output in the two-column layout (input left, result right) rather than stacking vertically, to match Tinker and Artisan (The Two-Column Rule).
- **Do** switch to the monospace stack for anything code-like (paths, commands, PHP output, log lines) and keep everything else in Geist Variable (The One Face Rule).
- **Do** size new interactive controls to the existing 32px/24–28px/36px button scale rather than inventing a new height.

### Don't:
- **Don't** give a card or button a shadow at rest — that breaks the flat/ring elevation model in one visible move.
- **Don't** introduce Signal Red for anything other than a destructive action — no status colors, no accents, no links in red.
- **Don't** render Artisan (or any command-output) stdout as HTML — only Tinker's dump output is sandboxed and safe to interpret as markup; command output can contain literal angle brackets.
- **Don't** add a second typeface. The monospace stack is the only permitted departure from Geist Variable, and only for code-like content.
- **Don't** design for phone/tablet breakpoints — this is a native desktop window, not a public site.
