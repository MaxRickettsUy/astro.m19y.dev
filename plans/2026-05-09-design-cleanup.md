# Design Cleanup & Dark Mode Plan

**Date:** 2026-05-09
**Scope:** Visual + structural cleanup of astro.m19y.dev. No new features, no content changes. Stick to Tailwind defaults; no custom design system.

---

## Goals (from user)

1. **Consistent spacing** across pages (page padding, section gaps, vertical rhythm).
2. **Consistent typography** — same heading scale and same body size across pages.
3. **Left alignment preserved.**
4. **Dark mode toggle** with the user's `prefers-color-scheme` driving the default; toggle persists in `localStorage`.
5. **Componentize / refactor** current components where the same markup repeats.
6. **Tailwind defaults only** — no custom theme tokens beyond what dark-mode requires.

---

## Current state (relevant facts)

- Single shared `Layout.astro` imports `global.css`, renders `Header` + `<main>` + `Footer`.
- `Layout.astro:44-57` has an inline `<style is:global>` that hardcodes `background-color: #F6F6F6` and a system-ui font, plus an unused `--accent`/`--accent-gradient` pair. This will fight any dark-mode work and should move into `global.css`.
- `global.css` still carries legacy rules from the pre-cleanup site:
  - `:root` declares `--bg-color: #181717`, `--font-color: #e1e1ff`, etc. — none of these are applied (the Layout inline style overrides body bg with `#F6F6F6`, and most pages use Tailwind colors). Dead.
  - `.navbar` (used only by `Header.astro` — sets a green background that conflicts with the rest of the light page).
  - `.archive`, `.disclaimer`, `.last-updated*`, `.disclaimer-container`, `.siteFooter*`, `.inner`, `.title-link`, `.post-text`, `.page-title`, `.centered-div`, `.gradient`, `.love`, `.meh`, `.skip` — used in a handful of places, mostly in `rwl/*.astro` and `Footer.astro`.
  - Global `* { padding: 0 }` and `li { list-style: none }` resets.
- Heading sizes are wildly inconsistent across pages:
  - `index.astro:29` uses `text-3xl`, `index.astro:41,50,77` use `text-xl`.
  - `uses.astro:9` uses `text-4xl`, `uses.astro:12,77` use `text-2xl`.
  - `cool-sites.astro:11` uses `text-2xl`.
  - `wine-night.astro:9,beans:9,merch:8,camp-wood:10,garden/2024:?` use `text-2xl`, then `text-xl` for sub-sections.
  - `rwl/2024.astro:15` uses `text-lg`; sub-headings are bare `<h2>` (no class).
  - `rwl/2024.astro:11` opens `<h3>` and closes `</h1>` (broken).
  - `wine-night.astro:11,55,83,113` and similar in other rwl files have `text-xl` `<h3>`s.
- Body copy mixes `text-[18px]`, `text-sm`, `text-md` (which is not a real Tailwind class — silently does nothing), and unstyled defaults.
- Page padding mixes `p-4`, `p-2`, `pl-4 pt-4`, `pt-4`, `pl-2`, `inner` (from CSS) — no shared rule.
- `Header.astro` is just an avatar wrapped in a green `.navbar` div. No nav, no theme toggle, no link styling.
- `Footer.astro` is a single-column disclaimer + `<p id="last-updated">` that nothing populates (the `last-updated` element is empty in production — dead).
- Astro `ClientRouter` is enabled (`Layout.astro:31`) — any theme-toggle script must survive view-transition swaps via `astro:after-swap`.

---

## Design decisions (committing to defaults)

### Typography scale (Tailwind defaults)

User confirmed: same font family across the site, **all headers the same size, all body the same size**. Headings differentiate from body via weight only.

| Use | Class | Size |
| --- | --- | --- |
| `<h1>` / `<h2>` / `<h3>` | `text-lg font-semibold` | 1.125rem, weight 600 |
| Body, lists, paragraphs | `text-base` (default) | 1rem |
| Small / metadata / "last updated" | `text-sm text-neutral-600 dark:text-neutral-400` | 0.875rem |
| Footnote / disclaimer | `text-xs text-neutral-600 dark:text-neutral-400` | 0.75rem |

Headings keep their semantic tags (`<h1>`/`<h2>`/`<h3>`) for structure and a11y, but render at the same size. The single visual differentiator between headings and body is weight (semibold vs. normal). No size jumps between page title and section title.

### Spacing primitives

- **Page wrapper:** `px-4 sm:px-6 py-6` — single shared rule.
- **Section gap:** parent `space-y-8` (between top-level sections) and `space-y-2` inside a section.
- **List item gap:** `gap-2` for inline lists, `gap-1` for tight badge rows.
- **Max width:** `max-w-3xl` on the page wrapper for readability (left-aligned within it).

### Color approach

User confirmed: **Tailwind `dark:` variant utilities directly**. No CSS custom properties. All color decisions live in markup.

Standard pairings used throughout the refactor:

| Surface | Light | Dark |
| --- | --- | --- |
| Body bg / text | `bg-neutral-50 text-neutral-900` | `dark:bg-neutral-950 dark:text-neutral-50` |
| Muted text (metadata, disclaimer) | `text-neutral-600` | `dark:text-neutral-400` |
| Border (cards, header/footer rules) | `border-neutral-200` | `dark:border-neutral-800` |
| Link | `text-blue-600 underline` | `dark:text-blue-400` |
| Card shadow | `shadow-md` | `dark:shadow-none` (shadows look bad on dark) |

`global.css` only declares `@import "tailwindcss";` and `@custom-variant dark …;`. No `:root` token block.

### Dark mode mechanics (Tailwind v4)

- Add `@custom-variant dark (&:where(.dark, .dark *));` to `global.css` so `dark:` utilities key off a `.dark` class on `<html>`.
- Inline a tiny pre-paint script in `Layout.astro` `<head>` that reads `localStorage.theme` and falls back to `matchMedia('(prefers-color-scheme: dark)')`, applying `.dark` to `<html>` synchronously to avoid FOUC.
- Toggle button in `Header.astro` writes `localStorage.theme = 'light' | 'dark' | 'system'` (three states; default is `system`).
- Re-apply on `astro:after-swap` so view transitions don't lose the class.

---

## Components to introduce / refactor

| Component | Purpose | Replaces |
| --- | --- | --- |
| `Page.astro` (new) | Wraps page content with the shared `px-4 sm:px-6 py-6 max-w-3xl space-y-8` + `<h1>` slot + optional "last updated" subtitle. | Repeated `<div class="p-4">` / `<div class="pl-4 pt-4">` blocks across every page. |
| `Section.astro` (new) | `<section>` with `<h2>` slot and `space-y-2` body. | Repeated `<div class="p-2"><h2 class="text-xl">…</h2>…</div>` patterns in `index.astro` and `uses.astro`. |
| `ThemeToggle.astro` (new) | Three-state button (system / light / dark) with svg icons. | n/a — net-new. |
| `Header.astro` (refactor) | Avatar + nav links + ThemeToggle, using flex/gap utilities, no `.navbar` class. | Current green-bar header. |
| `Footer.astro` (refactor) | Single-row disclaimer with muted color. Drop the dead `last-updated` element. | Current footer. |
| `ExternalLink.astro` (new) | `<a target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline">` with optional external-link icon slot. | ~30 hand-rolled `<a target="_blank" rel="noopener noreferrer">` instances across pages. |
| `Hr.astro` or just delete | The `<hr/>` in `rwl/*.astro` is fine as-is. Skip. | n/a |
| `GradientBar.astro` | Used only at the bottom of `rwl/*.astro`. Keep as-is — it's the one decorative element and is intentional. Confirm. | n/a |
| `Badge.astro` | Already fine. Keep. Maybe add `dark:` variants to the four color classNames. | n/a |
| `CoolSite.astro` | Refactor to use new `ExternalLink` and add `dark:` border variant. | n/a |
| `ArticleLink.astro`, `BookLink.astro`, `Spotify.astro`, `Merch.astro` | Already small, keep. Audit hardcoded colors only. | n/a |

`GradientBar`, `ArticleLink`, `BookLink`, `Spotify`, `Merch`, `Badge`, `CoolSite` — keep all of these; do not over-componentize.

---

## Implementation plan (PR-ordered)

### PR 1 — Foundation: dark-mode plumbing + global styles purge

**Files:** `src/styles/global.css`, `src/layouts/Layout.astro`.

- Rewrite `global.css`:
  - Keep `@import "tailwindcss";`
  - Add `@custom-variant dark (&:where(.dark, .dark *));`
  - Drop the `* { padding: 0 }` reset (Tailwind's preflight handles it).
  - Drop unused `:root` vars (`--bg-color`, `--font-color`, `--secondary-color`, `--heading-color`, `--link`, `--code-bg`, `--code-border`, `--primary-color`).
  - Drop `.navbar`, `.siteFooter*`, `.disclaimer*`, `.last-updated*`, `.inner`, `.post-text`, `.title-link`, `.page-title`, `.centered-div` — all replaced by Tailwind utilities in PRs 2–4.
  - Keep `.archive`, `.gradient`, `.love`, `.meh`, `.skip` (used in rwl/* and `GradientBar`) — but extend each with a `dark:` variant via `@variant dark { … }`.
  - Move the `html { font-family: system-ui, sans-serif; background-color: … }` from `Layout.astro:44-57` here, and replace the hardcoded background with `bg-neutral-50 text-neutral-900` applied to `<body>` directly in markup.
  - Drop the unused `--accent` / `--accent-gradient` vars.
- `Layout.astro`:
  - Remove the inline `<style is:global>` block entirely.
  - Add the pre-paint theme script to `<head>` (above `<ClientRouter />`):

    ```html
    <script is:inline>
      (() => {
        const stored = localStorage.getItem('theme');
        const sys = matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = stored === 'dark' || (stored !== 'light' && sys);
        document.documentElement.classList.toggle('dark', dark);
      })();
    </script>
    ```
  - Add `<script>` listening for `astro:after-swap` that re-runs the same logic so view transitions keep the class.
  - Apply base classes on `<body>`: `bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50`.

**Verification:** `npm run build`, `npm run dev`, toggle OS dark mode and refresh — body should flip without FOUC.

### PR 2 — `Page` and `Section` components, refactor `Header` + `Footer`

**Files:** new `src/components/Page.astro`, new `src/components/Section.astro`, new `src/components/ThemeToggle.astro`, `src/components/Header.astro`, `src/components/Footer.astro`.

- **`Page.astro`** — props: `title: string`, `lastUpdated?: string`. Renders:
  ```astro
  <div class="px-4 sm:px-6 py-6 max-w-3xl space-y-8">
    <header class="space-y-1">
      <h1 class="text-lg font-semibold">{title}</h1>
      {lastUpdated && <p class="text-sm text-neutral-600 dark:text-neutral-400">Last updated {lastUpdated}</p>}
    </header>
    <slot />
  </div>
  ```
- **`Section.astro`** — props: `title?: string`. Renders `<section class="space-y-2">` with optional `<h2 class="text-lg font-semibold">`.
- **`ThemeToggle.astro`** — single button cycling `system → light → dark → system`. Reads/writes `localStorage.theme`. Renders sun/moon/monitor svg by current state.
- **`Header.astro`** — drop `.navbar`. Avatar (home link) + theme toggle, nothing else:
  ```astro
  <header class="px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
    <nav class="flex items-center justify-between max-w-3xl mx-auto" aria-label="Site">
      <a href="/" aria-label="Home" class="flex items-center gap-2">
        <img src="/avatar.png" alt="" width="32" height="32" />
      </a>
      <ThemeToggle />
    </nav>
  </header>
  ```
- **`Footer.astro`** — strip the dead `last-updated` element. Two rows: attribution badges (moved from `index.astro:92-130`) and disclaimer:
  ```astro
  <footer class="px-4 sm:px-6 py-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
    <div class="max-w-3xl mx-auto flex flex-wrap items-center gap-3">
      <a target="_blank" rel="noopener noreferrer" href="https://tailwindcss.com/">…tailwind svg…</a>
      <a target="_blank" rel="noopener noreferrer" href="https://astro.build">…astro badge…</a>
      <a target="_blank" rel="noopener noreferrer" href="https://gossipsweb.net">…</a>
      <a target="_blank" rel="noopener noreferrer" href="https://bukmark.club/">…</a>
      <a href={`https://github.com/MaxRickettsUy/astro.m19y.dev/releases/tag/${version}`}>
        <span class="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700 text-neutral-900 dark:text-neutral-50">
          <svg class="h-1.5 w-1.5 fill-green-500" …></svg>
          v{version}
        </span>
      </a>
    </div>
    <p class="text-xs text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
      Disclaimer: All content on this site relates to personal opinions/experiences and does not reflect my work, employer and/or colleagues.
    </p>
  </footer>
  ```
  `Footer.astro` now reads `process.env.npm_package_version` itself.

### PR 3 — Page refactors: `index`, `uses`, simple random pages

**Files:** `src/pages/index.astro`, `src/pages/uses.astro`, `src/pages/random/beans.astro`, `src/pages/random/wine-night.astro`, `src/pages/random/camp-wood.astro`, `src/pages/random/merch-collection.astro`, `src/pages/random/garden/2024.astro`.

For each: wrap content in `<Page title="…" lastUpdated="…">`, group sub-sections with `<Section title="…">`, replace ad-hoc `text-3xl/text-4xl/text-xl/text-lg` headings with the unified scale, replace hand-rolled `<a target="_blank" rel="noopener noreferrer">` with `ExternalLink` if the helper is introduced (or do find/replace if skipping that component).

Specific touch-ups:

- `index.astro:29` — `text-3xl` → relies on `Page` `<h1>`. Drop the inner `<h1>`.
- `index.astro:41,50,77` — `text-xl` `<h2>`s → wrap in `<Section title="…">` (renders at `text-lg`).
- `index.astro:30-38` — `text-[18px]` body paragraphs → `text-base` (default).
- `index.astro:92-130` — the right-hand badge column. **Delete from `index.astro`** (badges now live in `Footer.astro`). The home page becomes a single left-aligned column without the sidebar. Drop the `flex flex-col sm:flex-row` outer wrapper since there's no second column anymore.
- `uses.astro:9` — `text-4xl` → drop, use `<Page title="uses 🖥️">`.
- `uses.astro:12,77` — `text-2xl` `<h2>`s → `<Section title="…">`.
- `uses.astro:14,28,44,...` — the `border border-dashed shadow-md` cards: extend with `dark:border-neutral-700` and `dark:shadow-none`.
- `uses.astro` `<p class="text-xl">` device names (lines 17, 30, 46, 80, 97, 113) → `<h3 class="text-lg font-semibold">` so they pick up the unified heading size.
- `wine-night.astro:11,55,83,113` — `<h3 class="text-xl">` → `<h3 class="text-lg font-semibold">`.

### PR 4 — Page refactors: `cool-sites` and `rwl/*`

**Files:** `src/pages/random/cool-sites.astro`, `src/pages/rwl/2021.astro`, `src/pages/rwl/2022.astro`, `src/pages/rwl/2023.astro`, `src/pages/rwl/2024.astro`.

- `cool-sites.astro` — wrap in `<Page title="😎 Cool Sites 😎" lastUpdated="03/07/2024">`, drop the four sibling `<span>`s in favor of one `<p>` with the description (text-sm). Audit `CoolSite.astro` for dark-mode (border, shadow, image background).
- `rwl/2024.astro:11` — fix broken `<h3>…</h1>` closing tag.
- `rwl/*` — replace the bare `<div class="inner">` with `<Page title="2024" …>`. Move the prev/next year links from inside `<Page>` into a small `<nav>` inside Page or alongside the title — decide once. Standardize sub-headings (`books / articles / albums`) to `<Section title="books">` etc.
- `GradientBar.astro` — keep, but add `dark:` variant for the love/skip text colors so they stay legible.

### PR 5 — Verification + final polish

**Files:** all touched files.

- `npm run astro -- check` — fix any errors.
- `npm run build` and click through every page in `dev` with both light + dark.
- Walk through every `<a target="_blank">` and confirm `rel="noopener noreferrer"`.
- Walk through every `Image` / `<img>` and confirm a meaningful `alt` (or empty `alt=""` for decorative).
- Confirm tab order on the theme toggle.
- Add a CHANGELOG entry under `## [Unreleased]` summarizing the design pass.

---

## Decisions resolved

- **Typography:** same font family across the site; all headings render at `text-lg font-semibold`, all body at `text-base`. Headings keep semantic tags, differentiate from body via weight only.
- **Dark mode:** Tailwind `dark:` variant utilities directly. No CSS custom-property color tokens.

## Decisions resolved (cont.)

- **Header nav:** keep minimal — avatar (home link) + `ThemeToggle` only. The home page is already the index for the site; deep-linked pages get back-to-home via the avatar. No Random/RWL/Uses links in the header.
- **`ExternalLink` component:** introduce it. ~30 hand-rolled instances exist; centralizing it locks in `rel="noopener noreferrer"` (security), gives a consistent underline + optional external-link icon, and makes future tweaks one-line. The component is small enough that the abstraction is net-positive.
- **Home-page right-hand badge column:** move to the footer. The "Built with Astro / Tailwind / gossipsweb / bukmark / vYYYY.M.D" cluster is exactly the kind of attribution that belongs in a footer, not crowding the home page's primary content. The footer becomes a two-row layout: badges row on top, disclaimer row underneath. No other page renders these badges, so they only appear on every page once they move to the shared footer — that's fine and more consistent.
- **`ClientRouter` view transitions:** keep enabled. It's lightweight, gives the site a nicer cross-page feel, and the proposed `astro:after-swap` listener handles the dark-mode persistence cleanly.

---

## Out of scope (for this plan)

- Custom fonts, custom color palettes, custom design tokens beyond the dark/light pair.
- Content changes (no rewriting copy, adding posts, etc.).
- Tailwind 3 → 4 (already done in the May 2026 cleanup).
- Content collections migration.
- Mobile-specific layout changes beyond keeping `sm:` breakpoints already in place.

---

## Critical files

- `src/layouts/Layout.astro`
- `src/styles/global.css`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- new: `src/components/Page.astro`, `src/components/Section.astro`, `src/components/ThemeToggle.astro`
- `src/pages/index.astro` (largest single refactor)

---

## Icon library: `astro-icon` (Iconify)

Use `astro-icon` as the icon source — wraps the Iconify ecosystem so any icon set can be referenced by name without bundling unused icons.

### Setup

- `npm install astro-icon` (or `npx astro add astro-icon`).
- Add the integration to `astro.config.mjs`:
  ```js
  import { defineConfig } from 'astro/config';
  import icon from 'astro-icon';
  export default defineConfig({
    integrations: [icon()],
  });
  ```
- Install the icon set(s) we'll pull from. Recommend **Lucide** (`@iconify-json/lucide`) — clean, minimal stroke icons that pair well with the unified neutral palette and inherit `currentColor` so dark mode is free.
  - `npm install --save-dev @iconify-json/lucide`

### Usage pattern

```astro
---
import { Icon } from 'astro-icon/components';
---
<Icon name="lucide:sun" class="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
```

`astro-icon` inlines the SVG at build time — no runtime fetch, no `<script>` cost — and tree-shakes to only the icons actually used.

### Icons needed for this refactor

| Component | Icon | Iconify name |
| --- | --- | --- |
| `ThemeToggle.astro` (system state) | monitor | `lucide:monitor` |
| `ThemeToggle.astro` (light state) | sun | `lucide:sun` |
| `ThemeToggle.astro` (dark state) | moon | `lucide:moon` |
| `ExternalLink.astro` (optional) | arrow-up-right or external-link | `lucide:arrow-up-right` |
| `CoolSite.astro` / link rows | github | `lucide:github` |
| `CoolSite.astro` / link rows | rss | `lucide:rss` |

### Migration of existing SVG assets

Once `astro-icon` is in place, delete the hand-imported icons in `src/img/`:

- `src/img/external-link.svg` (replaced by `lucide:arrow-up-right` inside `ExternalLink.astro`)
- `src/img/github.svg` (replaced by `lucide:github` — used in `index.astro`, `CoolSite.astro`)
- `src/img/rss.svg` (replaced by `lucide:rss` — used in `CoolSite.astro`)

This removes the three remaining `import x from '@img/*.svg'` + `<Image src={x} />` patterns and replaces each with `<Icon name="lucide:…" />`. After migration `src/img/` should contain only page-level photographic assets — no decorative iconography.

### Where this slots into the PR sequence

Add icon setup to **PR 1** (Foundation) so PR 2 can use `<Icon>` directly inside `ThemeToggle` and refactored `Header.astro` without a follow-up swap. The `src/img/*.svg` deletions ride along in PR 4 (or the verification PR) once all callers have been migrated.
