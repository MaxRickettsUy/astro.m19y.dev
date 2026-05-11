# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Astro dev server (default `localhost:4321`)
- `npm run build` — build the production site to `./dist/`
- `npm run preview` — preview the production build locally
- `npm run astro -- <cmd>` — run any Astro CLI command (e.g. `astro check`, `astro add`)

There are no tests, lint, or type-check scripts wired up. Use `npm run build` as the primary verification pass; `npm run astro -- check` gives ad-hoc TypeScript/Astro diagnostics. Don't edit `dist/` by hand — it is generated.

## Architecture

Personal site (https://m19y.dev) built with **Astro 6 + Tailwind CSS 4**, deployed to **Netlify**. Small archive of links, projects, and yearly read/watch/listen logs — pages are static and content is mostly hardcoded inside `.astro` frontmatter or loaded from JSON files in `public/`.

### Routing & layout

- All routes come from `src/pages/`. Astro file-based routing maps `src/pages/foo/bar.astro` → `/foo/bar`. Hand-written `href` values sometimes use `.html` suffixes (legacy) — Astro routes work without them, so check existing links in a section before adding new ones.
- Top-level sections: `index.astro` (home), `uses.astro`, `random/` (collections like cool sites, garden, merch, wine night, camp wood, beans), `rwl/` (read/watch/listen by year).
- `src/layouts/Layout.astro` is the single shared layout. It pulls in `Header`, `Footer`, `ClientRouter` view transitions, the Umami analytics script, and the global stylesheet `src/styles/global.css` (the only stylesheet — earlier multi-file CSS was consolidated in May 2026).
- Dark mode is handled by an inline script in `Layout.astro` that toggles a `dark` class on `<html>` based on `localStorage.theme` + system preference, re-applied on `astro:after-swap` so view transitions don't flash.

### Tailwind

Tailwind 4 is loaded via the `@tailwindcss/vite` plugin in `astro.config.mjs` (no PostCSS/Tailwind config files). Tailwind directives + custom global CSS live in `src/styles/global.css`. Tailwind utilities are the default styling mechanism in templates.

### Path aliases (tsconfig.json)

Prefer aliases over relative paths:

- `@components/*` → `src/components/*`
- `@layouts/*` → `src/layouts/*`
- `@img/*` → `src/img/*`
- `@styles/*` → `src/styles/*`
- `@public/*` → `public/*` (used to import JSON data files like `@public/garden/2024.json`)

### Content data pattern

List/gallery pages typically import JSON from `public/` (e.g. `arcticles.json` — note the typo in the filename, `coolSites.json`, `campWood.json`, `garden/<year>.json`) and `.map()` over arrays in the template. To add new entries to a collection, edit the JSON file rather than the `.astro` file.

### Images

Page-level images live in `src/img/` and are rendered through `astro:assets`'s `<Image />` for optimization. Static assets (favicons, downloadable files, JSON data, large gallery images) live in `public/` and are referenced by absolute URL (e.g. `/avatar.png`).

### Versioning

`package.json` uses calendar versioning (`YYYY.M.D` or `YYYY.M.D.N` for same-day releases). Bumping the version requires: (a) a `CHANGELOG.md` entry under a new `## [YYYY.M.D]` heading, and (b) a matching GitHub release tag — the footer/home badge links to that tag.

## Other notes

- `AGENTS.md` covers similar ground for non-Claude agents — keep the two roughly in sync when conventions change.
- `plans/` contains planning notes, not site content; don't render or link them.
