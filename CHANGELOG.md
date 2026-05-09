# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow CalVer `YYYY.M.D`.

**Policy:** bumping `package.json:version` requires (a) a matching entry here and (b) a matching GitHub release tag linked from the homepage version badge.

---

## [Unreleased]

### Removed
- `src/pages/posts/upgrade-wiki-js-heroku.astro`, `configuring-flutter-linux-mint.astro`, `resizable-vuetify-table.astro` — outdated 2021–2022 posts
- `src/pages/posts.astro` — manual post index, removed with the posts it listed

---

## [2026.5.9] — 2026-05-09

### Changed
- Upgrade Astro 5 → 6.3.1; replace deprecated `<ViewTransitions />` with `<ClientRouter />`
- Upgrade Tailwind 3 → 4; migrate from `@astrojs/tailwind` integration + `tailwind.config.cjs` to `@tailwindcss/vite` plugin with CSS-native config
- Upgrade `@types/node` 20 → 22; pin Netlify build environment to Node.js 22
- Reconcile `package.json` declared versions with installed lockfile (Astro 5, `@astrojs/tailwind` 6, `@types/node` 22)
- Consolidate 6 stylesheet imports into single `src/styles/global.css`; remove dead CSS (~60% reduction)
- Fix duplicate `<meta charset>` / `<meta viewport>` tags and broken favicon reference in `Layout.astro`
- Replace hardcoded OG tags with per-page dynamic props (`og:title`, `og:description`, `og:url`)
- Add `description` prop to `Layout.astro` interface
- Remove redundant `<Header />`/`<Footer />` renders in all three `posts/*.astro` pages
- Drop `.html` suffixes from all internal hrefs (`rwl/*.html` → `/rwl/*`, `posts/*.html` → `/posts/*`)
- Fix wrong title `"rwl 2023"` on `rwl/2024.astro`; remove stale "2025 ›" link
- Fix mismatched closing tags `<h3>...</h1>` in `wine-night.astro` (4 instances)
- Standardize year headings across `rwl/*.astro` to `<h2>` (were `<h1>`)
- Demote "Random", "Projects", "Read/Watch/Listen" section headings in `index.astro` from `<h1>` to `<h2>`
- Fix `camp-wood.astro` page title (was `"merch-collection"`)
- Remove dead local `<style>` blocks from `merch-collection.astro`, `camp-wood.astro`, `garden/2024.astro`
- Remove dead `Header`/`Footer` imports from `camp-wood.astro` and `garden/2024.astro`
- Add `aria-label` to `<nav>` and home link in `Header.astro`; switch avatar from `astro:assets` import to direct `<img src="/avatar.png">`
- Rewrite `README.md` with project-specific content replacing Astro boilerplate

### Fixed
- Add `rel="noopener noreferrer"` to all `<a target="_blank">` links site-wide
- Fix missing and empty `alt` attributes on hardware/software images in `uses.astro`; add `alt` to `CoolSite` screenshot image
- Fix double `<hr/>` and malformed `<p>` tag in `rwl/2023.astro`
- Rename `garden/2024.astro` page title from `"merch-collection"` to `"Garden 2024"`

### Removed
- `scripts.js` — unreferenced legacy file from the pre-Astro site
- `src/components/Card.astro` — unused component (0 imports)
- `src/img/favicon.png`, `github.png`, `linkedin.png`, `me.jpg`, `merle.png`, `xps13.jpg` — unreferenced images
- `public/software/raindrop.png` — unreferenced public asset
- `src/styles/styles.css`, `footer.css`, `header.css`, `main.css`, `new.css`, `new-styles.css` — consolidated into `global.css`
- `tailwind.config.cjs` — replaced by Tailwind 4 CSS-native config

---

## [2025.3.12] — 2025-03-12

### Added
- New wine night entries (03/08/2025 session)
- Additional merch collection photos

---

## [2024.3.7] — 2024-03-06

### Added
- Bukmark.club member badge on homepage
- Camp Wood photo gallery (`/random/camp-wood`)
- Cool sites JSON config; new site entries
- Spotify embeds on RWL pages

### Changed
- Layout updates

---

## [2024.1.11] — 2024-01-11

### Added
- Garden photo gallery (`/random/garden/2024`) — 2024-08-31
- Beans page (`/random/beans`) — 2024-04-06
- Wine night entry (04/28/2024)

### Changed
- RWL 2023 and 2024 updates

---

## [2023.11.22] — 2023-11-22

### Added
- `uses` page
- Version badge on homepage linked to GitHub release tag
- Umami analytics
- Cloudflare analytics (later replaced by Umami)
- View transitions via Astro `<ViewTransitions />`

### Changed
- Articles migrated from inline HTML to `arcticles.json`
- RWL pages refactored to map over JSON data
- Astro upgraded to v3

---

## [Initial] — 2023-10-25

### Added
- Astro + Tailwind site scaffold
- Converted legacy HTML pages to Astro components
- `Layout.astro` with shared Header/Footer
- RWL pages (2021, 2022, 2023)
- Cool sites page
- Wine night page
- Netlify deployment config (`netlify.toml`)
