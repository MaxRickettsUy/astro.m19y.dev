# Upgrade, Cleanup, and Refactor Plan

**Date:** 2026-05-09
**Scope:** astro.m19y.dev — package upgrades, dead code removal, Astro best-practices refactor, tag consistency, and introducing a CHANGELOG.

---

## Confirmed findings

- **Lockfile drift.** `package.json` declares `astro ^4.0.7` but `npm outdated` reports installed `astro@5.4.3`, `@astrojs/tailwind@6.0.0`. The lockfile and `node_modules` are already on Astro 5 / `@astrojs/tailwind` 6. Latest available: `astro@6.3.1`, `@astrojs/tailwind@6.0.2`, `tailwindcss@4.3.0`, `@types/node@25.6.2`. The first PR should reconcile `package.json` to the truth in the lockfile before deciding on further bumps.
- **`scripts.js`** at repo root: zero references anywhere (no `<script src>`, no `.html`, no `.astro`). Dead code from the legacy site.
- **`Header.astro` and `Footer.astro` re-import 5 of the 6 stylesheets** that `Layout.astro` already imports (only `styles.css` is omitted). All three `posts/*.astro` files redundantly import `Header` and `Footer` and render them again on top of the Layout-supplied ones — these post pages render two headers and two footers.
- **`Card.astro`** (`src/components/Card.astro`) is never imported or used.
- **Hardcoded `.html` hrefs** in `src/pages/index.astro:12-15` (`rwl/2021.html`–`rwl/2024.html`) and `src/pages/posts.astro:12,17,22` (`posts/*.html`).
- **`Layout.astro` `<head>` duplication:** `<meta charset="UTF-8">` appears on both line 23 and line 30; `<meta name="viewport">` appears on both line 24 and line 29; favicon is declared twice (line 25 SVG, line 28 PNG with broken relative path `img/merle.png` that will 404 from any nested route). OG metadata is hardcoded (`og:title=projects`, `og:url=…/random.html`, `og:image=img/merle.png`).
- **Heading hierarchy:** `index.astro` uses `<h1>` four times (Welcome, Random, Projects, RWL) — should be one `<h1>` and the rest `<h2>`. `posts.astro` uses `<h1 class="text-xl">` for the page title while peers use `<h2 class="text-2xl">`. `rwl/2024.astro:11` opens `<h3>` and closes with `</h1>` (broken closing tag) — same bug at lines 65 and 102 of `wine-night.astro`. `rwl/2024.astro` and `rwl/2023.astro` use `<h2>` without size classes; `rwl/2021.astro` and `rwl/2022.astro` use `<h2 class="text-lg">`.
- **`<a target="_blank">` without `rel="noopener noreferrer"`** is widespread (uses, wine-night, merch, rwl/\*). Only `resizable-vuetify-table.astro` does it correctly.
- **Empty `alt=""` on real images** in `uses.astro` (5+ instances) and `wine-night.astro` (every wine image). Some `<img>` tags in `uses.astro:62-69` have no `alt` at all.
- **Header.astro imports `avatar` from `'../../public/avatar.png'`** instead of using the `@public/` alias or moving to `src/img/`. Importing from `public/` through `astro:assets` is non-idiomatic.
- **Globally-leaked styles:** `Layout.astro:39-43` has a non-`is:global` `<style>` block applying `li { color: white }`. `merch-collection.astro`, `camp-wood.astro`, `garden/2024.astro` all repeat the same `li { color: white }` + image padding/cursor block locally.
- **CSS dead/duplicated rules** (used count = `grep` hits in `src/**/*.astro`):
  - `new.css` — defines `.navbar` (only used in Header.astro), `.bar` (0 uses), `.nav-menu/.nav-item/.nav-link/.nav-logo` (0 uses each), the Roboto `@font-face` (font isn't applied — `Layout` sets `font-family: system-ui`).
  - `new-styles.css` — `.theme-switch*` / `.slider*` (0 uses), `body { background: var(--bg-color) }` etc. duplicates `main.css`'s `body` styling. `[data-theme=light]` block is dead (no theme switcher exists).
  - `footer.css` — `.siteFooter*` only used in `Footer.astro`; defines color rules redundant with Tailwind defaults.
  - `header.css` — `.siteHeader*` 0 uses (Header.astro uses Tailwind `.navbar` from `new.css` instead).
  - `styles.css` — many dead selectors: `.avatar`, `.xps`, `.hamburger`, `.flex-row .col`, `.logos`, `.nav-bar`, `.spacer`, `.centered-content`, `ul#blogs li`, `.merch-container`. Used: `.archive`, `.disclaimer`, `.disclaimer-container`, `.last-updated*`, `.inner`, `.title-link`, `.love`, `.skip`, `.meh`, `.gradient`, `.centered-div`, `.page-title`, `.post-text`, `.my-container`, `.flex-grid`, `.scrollContainer`, `.section-link-container`.
  - `main.css` — `h1,h2,h3 { color: #f5f5f5 }` conflicts with `new-styles.css`'s `--heading-color` and the body background `#F6F6F6` from Layout's inline `<style is:global>` (white-ish text on light grey body — only readable because `<main>`'s parent isn't styled).
- **Unused images in `src/img/`:** `favicon.png`, `github.png`, `linkedin.png`, `me.jpg`, `merle.png` (only referenced from the broken `Layout.astro:28,34`), `xps13.jpg`. Used: `external-link.svg`, `github.svg`, `rss.svg`. (`favicon.svg` lives in `public/` and is used.)
- **Unused public assets:** all four JSON files (`arcticles.json`, `campWood.json`, `coolSites.json`, `garden/2024.json`) are imported. All `public/desktop/*.png` are used in `uses.astro`. In `public/software/`: `gitlab.png`, `mui.png`, `react.png`, `vscode.webp`, `astro.png`, `github.png`, `netlify.png`, `chrome.png`, `safari.png`, `brave.png` are referenced; `raindrop.png` is **unused**.
- **Tailwind config** (`tailwind.config.cjs`) has no theme customization and no plugins. `content` glob is the default. Nothing meaningful to migrate to v4 css-config.

---

## Implementation plan (PR-ordered)

### PR 1 — Reconcile `package.json` to lockfile, document baseline

**Files:** `package.json`

The repo currently runs on Astro 5 + `@astrojs/tailwind` 6 even though `package.json` says `^4.0.7` / `^5.0.4`. Bump declared ranges to match what's actually installed before any further upgrade so subsequent PRs have a clean diff:

- `astro`: `^4.0.7` → `^5.4.3`
- `@astrojs/tailwind`: `^5.0.4` → `^6.0.0`
- `@types/node`: `^20.10.3` → `^20.19.40` (already installed)
- `tailwindcss`: leave at `^3.3.1` (still on 3.x)

Run `npm install` to refresh `package-lock.json`, then `npm run build` to verify the site still builds.

**Decision needed from user:** is the running site on Netlify already using Astro 5 (last deploy was Mar 2025), or is Netlify pinned to an older lockfile?

### PR 2 — Astro 5 → 6 upgrade

**Files:** `package.json`, possibly `astro.config.mjs`, all `.astro` pages that use `astro:assets`.

Run `npm run astro -- check` first to surface diagnostics on the 5.x baseline. Then bump:

- `astro`: `^5.4.3` → `^6.3.1`

Astro 5→6 risk areas to review (this site does use them):

- `astro:assets` `<Image />` — used in `index.astro`, `Header.astro`, `CoolSite.astro`, `garden/2024.astro`, `camp-wood.astro`, `wine-night.astro`, `beans.astro`. Confirm prop signature (`width`/`height` still required for remote images, `alt` is required — currently many are empty strings, see PR 6).
- `ViewTransitions` was deprecated in favor of `<ClientRouter />` in Astro 5; in Astro 6 it may be removed. Check `Layout.astro:2`.
- Content collections — not currently used, no migration needed (see PR 7 for opt-in).
- Default `output` mode — confirm `astro.config.mjs` doesn't need `output: 'static'` made explicit.

After upgrade, run `npm run astro -- check` and `npm run build`, and fix surfaced errors only.

### PR 3 — `@types/node` to current LTS major

**Files:** `package.json`

`@types/node` `^20.19.40` → `^22.0.0` (or `^24.0.0`). Low risk — the repo has no Node runtime code beyond Astro internals.

### PR 4 — Tailwind 3 → 4 (deferred / decision needed)

**Files:** `tailwind.config.cjs` (delete), `astro.config.mjs`, all CSS files, possibly `package.json`.

Tailwind 4 is a real rewrite:

- New install: `tailwindcss@4` + `@tailwindcss/vite` (the Astro integration `@astrojs/tailwind` is officially superseded by the Vite plugin in v4 — check upstream guidance current as of upgrade date).
- Config moves from `tailwind.config.cjs` to a CSS `@theme` directive in a root stylesheet.
- `content` glob auto-detection means `tailwind.config.cjs` becomes unnecessary; the current config has nothing custom, so the migration is mostly mechanical.
- A few v3 classes were removed/renamed (`shadow-sm` → `shadow-xs`, `bg-opacity-*` → `bg-black/50`, etc.). Run `npx @tailwindcss/upgrade@latest`.
- Import statement changes from `@tailwind base; @tailwind components; @tailwind utilities;` → `@import "tailwindcss";`. The current site doesn't have a Tailwind entrypoint CSS (the integration injects it), so this is auto-handled by the integration swap.

**Decision needed:** PR 4 is the highest-risk single change. Recommend doing it after PR 5 (CSS purge) so there is far less CSS to migrate. Could also be deferred indefinitely — Tailwind 3 will continue to receive security fixes.

### PR 5 — Stylesheet consolidation and dead-CSS purge

**Files:** all of `src/styles/*.css`, `Layout.astro`, `Header.astro`, `Footer.astro`, the three `posts/*.astro` files, `merch-collection.astro`, `camp-wood.astro`, `garden/2024.astro`.

Consolidate the 6 stylesheets into a single `src/styles/global.css`:

- Keep only the rules referenced in pages (the `.archive .disclaimer .disclaimer-container .last-updated .last-updated-container .inner .title-link .love .skip .meh .gradient .centered-div .page-title .post-text .my-container .flex-grid .siteFooter* .navbar` set) plus the `:root` CSS-vars block from `new-styles.css`.
- Delete: `.avatar`, `.xps`, `.hamburger`, `.flex-row .col`, `.logos`, `.nav-bar`, `.spacer`, `.centered-content`, `ul#blogs li`, `.merch-container`, `.scrollContainer*`, `.section-link-container`, the entire Roboto `@font-face`, the entire `.theme-switch*` / `.slider*` block, all `.bar / .nav-menu / .nav-item / .nav-link / .nav-logo` rules, all `.siteHeader*` rules (Header.astro doesn't use them).
- Decide on `body` color: `main.css` says `#f5f5f5` text on `Layout.astro`'s `#F6F6F6` body background — invisible. Pick one (probably keep light bg, dark text — opposite of current).
- Remove the per-component CSS imports in `Header.astro:6-10` and `Footer.astro:3-7` — `Layout.astro` already imports them globally, so they're loaded 3× per page.
- Remove the duplicated inline `<style>{ li { color: white } img { padding } img:hover { cursor } }` blocks from `merch-collection.astro:26-37`, `camp-wood.astro:34-44`, `garden/2024.astro:33-43` — fold into `global.css` if needed.
- Remove `Layout.astro:39-43` non-global `<style>` (the `li { color: white }` rule conflicts with the dark-text site).

### PR 6 — Astro best-practices refactor

**Files:** `Layout.astro`, `posts.astro`, `index.astro`, all 3 `posts/*.astro`, `Header.astro`.

- **`Layout.astro` head fix:**
  - Remove duplicate `<meta charset>` (line 30) and duplicate `<meta name="viewport">` (line 29).
  - Remove the broken `<link rel="shortcut icon" href="img/merle.png">` (line 28) — relative URL 404s on nested routes; the `favicon.svg` link on line 25 is sufficient.
  - Replace hardcoded OG tags with per-page props. Extend `Props` to accept `description?: string`, `ogImage?: string`, `ogUrl?: string`. Default `og:url` to `Astro.url.href`. Default `og:image` to a real public asset (e.g. `/avatar.png` or a new `/og-default.png`).
  - Pass `description` through from each page's frontmatter.
- **Drop `.html` suffixes:**
  - `index.astro:12-15`: `rwl/2021.html` → `/rwl/2021`, etc.
  - `posts.astro:12,17,22`: `posts/foo.html` → `/posts/foo`.
- **Remove redundant Header/Footer/body wrappers from `posts/*.astro`** (all three files): delete the imports of `Footer`/`Header`, delete the `<body>`, `<div class="my-container">`, `<main>`, `<Header />`, `<Footer />` wrappers — `Layout` already provides them. Keep only the `<div class="flex-grid">…</div>` content tree.
- **`posts.astro` is itself a good candidate to delete.** It's a manual list of three links. Either delete it entirely (the home page already has no link to `/posts`) or replace it with a directory listing generated from `Astro.glob`/Content Collections (PR 7). **Decision needed.**
- **Move `avatar.png` from `public/` to `src/img/`** so `Header.astro` can `import avatar from '@img/avatar.png'` instead of reaching into `public/` via relative path.
- **Header.astro `<nav>` accessibility:** add `aria-label="Site"` and replace the bare avatar `<a>` with one that has visible text or `aria-label="Home"`.

### PR 7 — Content Collections migration (optional, decision needed)

**Files:** new `src/content/config.ts`, move `public/arcticles.json` → `src/content/articles/2021.json` etc. (or keep one JSON keyed by year), move `public/coolSites.json` → `src/content/coolSites/`, move `public/campWood.json` → `src/content/`, move `public/garden/2024.json` → `src/content/garden/`. Update `rwl/*.astro`, `cool-sites.astro`, `camp-wood.astro`, `garden/2024.astro` to use `getCollection`/`getEntry` and Zod schemas.

**Decision needed:** does the user want this? It adds a small amount of structure (typed schemas, validation) for a personal site that doesn't need it. The existing `import json from '@public/foo.json'` pattern works fine. Recommend skipping unless the user wants typed validation.

**Note:** Content Collections are required for any future Markdown post conversion — if the user wants to convert the three `posts/*.astro` files to Markdown later, this migration becomes a prerequisite.

The three posts in `src/pages/posts/`:

- `posts/upgrade-wiki-js-heroku.astro` — covers Heroku free tier, which was discontinued Nov 2022. **Decision needed:** delete or keep as historical reference?
- `posts/configuring-flutter-linux-mint.astro` — last updated April 2022, likely outdated. **Decision needed.**
- `posts/resizable-vuetify-table.astro` — Vuetify 2 era. **Decision needed.**

### PR 8 — Tag/heading consistency pass

**Files:** all `.astro` pages.

- One `<h1>` per page. `index.astro` keeps `Welcome! I'm Max.` as the only `h1`; "Random", "Projects", "Read/Watch/Listen" become `h2`.
- `posts.astro` `<h1 class="text-xl">` → `<h2 class="text-2xl">` to match `cool-sites.astro` style.
- Fix broken `<h3>...</h1>` closing tags in `wine-night.astro:11,65,102` and `rwl/2024.astro:11`.
- Standardize `rwl/*.astro`: all four years use `<h2 class="text-lg">` consistently.
- Add `rel="noopener noreferrer"` to every `<a target="_blank">` (or set up an Astro plugin / global handler — simpler is just doing the find/replace).
- Fill `alt` attributes:
  - `uses.astro` images of phones/laptops/components — descriptive alt or `alt=""` if purely decorative (only acceptable when the surrounding text fully describes the image).
  - `wine-night.astro` — every `Image` has `alt=""`. Use the wine name from the link or `title` attribute.
  - `merch-collection.astro` `Merch` component — propagate an `alt` prop.
  - `garden/2024.astro` and `camp-wood.astro` already have `alt="Camp image"` — fine but generic; consider indexing by photo.
- `lang="en"` is already set on `<html>` — fine.

### PR 9 — Dead file removal

**Files to delete:**

- `scripts.js` (legacy, 0 references).
- `src/components/Card.astro` (0 imports).
- `src/img/favicon.png` (replaced by `public/favicon.svg`, no references).
- `src/img/github.png` (only `github.svg` is imported).
- `src/img/linkedin.png` (0 references).
- `src/img/me.jpg` (0 references).
- `src/img/merle.png` (only referenced by the broken Layout `<head>` tags being removed in PR 6).
- `src/img/xps13.jpg` (0 references).
- `public/software/raindrop.png` (0 references).
- `README.md` — currently the Astro template boilerplate, not project-specific. **Decision needed:** delete or rewrite as a real project README pointing to `CLAUDE.md`?
- After PR 5, also delete: `src/styles/styles.css`, `src/styles/footer.css`, `src/styles/header.css`, `src/styles/main.css`, `src/styles/new.css`, `src/styles/new-styles.css` (replaced by single `src/styles/global.css`).

### PR 10 — `CHANGELOG.md` introduction

**Files:** new `CHANGELOG.md` at repo root.

Use Keep a Changelog format with the existing CalVer (`YYYY.M.D`) — it matches `package.json:version` and the GitHub release tag the homepage badge already links to (`index.astro:122`). Sections per release: `Added`, `Changed`, `Fixed`, `Removed`.

Reconstruct entries from `git log`. Tagged releases visible in history:

- **2025.3.12** — Added wine-night entries; updated merch collection. (commits `ef6a81b`, `cc1455d`, `3b67bbc`).
- **Unreleased between 2024.3.7 and 2025.3.12** — Added garden page (`7dfcf90`); added beans page (`4ddfbd8`); added wine-night entries (`f92e92f`).
- **2024.3.7** — Cool sites updates, layout updates, coolSites JSON config (`b39fcbc`, `36838bd`, `74301c7`, `381e294`, `f70fe39` Spotify embeds, `f837efc`/`a3a6b22`/`2bde3ac` camp wood, `24fd92d` bukmark badge).
- **2024.1.11** — RWL updates (`d6b2f57`, `bad2717`, `2f54dda`, `a91523f`).
- **2023.11.22** — Articles JSON migration, RWL refactor, version badge, Cloudflare/Umami analytics, Astro upgrade + ViewTransitions, uses page (`ff4b889` and surrounding commits).
- **Pre-2023.11.22 (Initial)** — Astro/Tailwind setup, legacy page conversion, RWL pages, cool sites, wine-night, uses, layouts. Group as a single seed entry.

Document the going-forward policy in the CHANGELOG header: _"Bumping `package.json:version` requires (a) a matching `CHANGELOG.md` entry and (b) a matching GitHub release tag."_ Reinforce this in `CLAUDE.md`'s Versioning section.

---

## Recommended PR sequencing

1. PR 1 (lockfile sync) — must come first.
2. PR 5 (CSS purge) — orthogonal to upgrades, do early to make Tailwind 4 migration trivial.
3. PR 9 (dead file removal) — can ride alongside PR 5 or be its own PR.
4. PR 6 (Astro best-practices) — head/meta/`.html`/redundant-Header refactor.
5. PR 8 (heading and a11y pass) — fold into PR 6 if small enough.
6. PR 2 (Astro 6 upgrade).
7. PR 3 (Node types).
8. PR 4 (Tailwind 4) — last, because the surface area shrinks after PRs 5–6.
9. PR 7 (Content Collections) — only if user wants it.
10. PR 10 (CHANGELOG) — can land any time; do alongside the first version bump after this audit so the new entry is the inaugural one.

---

## User decisions needed

1. Keep or delete the three legacy posts in `src/pages/posts/`? (Heroku/Vuetify/Flutter — all 2021–2022 era, likely outdated.)
2. Keep `posts.astro` as a manual index, replace with a glob/collection-based listing, or delete it?
3. Migrate to Content Collections (PR 7) or stick with `import json from '@public/...'`?
4. Upgrade to Tailwind 4 now, or stay on 3.x for stability?
5. Rewrite `README.md` as a real project README, or delete it (since `CLAUDE.md` exists)?
6. Confirm Netlify is currently building with the Astro 5 lockfile (not the package.json declared `^4.0.7`) — this affects whether PR 1 is a no-op for production or an actual deploy change.

---

## Critical files

- `src/layouts/Layout.astro`
- `package.json`
- `src/styles/styles.css`
- `src/pages/index.astro`
- `tailwind.config.cjs`
