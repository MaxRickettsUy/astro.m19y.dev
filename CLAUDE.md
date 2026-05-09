# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Astro dev server (default `localhost:4321`)
- `npm run build` — build the production site to `./dist/`
- `npm run preview` — preview the production build locally
- `npm run astro -- <cmd>` — run any Astro CLI command (e.g. `astro check`, `astro add`)

There are no tests, linters, or type-check scripts wired up. Use `npm run astro check` for ad-hoc TypeScript/Astro diagnostics.

## Architecture

Personal website (https://m19y.dev) built with **Astro 4 + Tailwind**, deployed to **Netlify**. The site is a small archive of links, projects, and yearly read/watch/listen lists — pages are static and content is mostly hardcoded inside `.astro` frontmatter or loaded from JSON files in `public/`.

### Routing & layout

- All routes come from `src/pages/`. Astro file-based routing maps `src/pages/foo/bar.astro` → `/foo/bar`. Note that hand-written `href` values sometimes use `.html` suffixes (legacy) — Astro routes work without them; check existing links in a section before adding new ones.
- Top-level sections: `index.astro` (home), `posts/` (technical write-ups), `random/` (collections like cool sites, garden, merch, wine night, camp wood, beans), `rwl/` (read/watch/listen by year — 2021–2024), `uses.astro`.
- `src/layouts/Layout.astro` is the single shared layout. It pulls in `Header`, `Footer`, view transitions, the Umami analytics script, and **all six stylesheets from `src/styles/` globally** (`styles.css`, `footer.css`, `header.css`, `main.css`, `new.css`, `new-styles.css`). Adding a page that uses `Layout` inherits all of these — be aware of cascade collisions when authoring new styles.

### Path aliases (tsconfig.json)

Imports use these aliases — prefer them over relative paths:

- `@components/*` → `src/components/*`
- `@layouts/*` → `src/layouts/*`
- `@img/*` → `src/img/*`
- `@styles/*` → `src/styles/*`
- `@public/*` → `public/*` (used to import JSON data files like `@public/garden/2024.json`)

### Content data pattern

List/gallery pages typically import JSON from `public/` (e.g. `arcticles.json`, `coolSites.json`, `campWood.json`, `garden/2024.json`) and `.map()` over arrays in the template. To add new entries to a collection, edit the JSON file rather than the `.astro` file.

### Images

Page-level images live in `src/img/` and are rendered through `astro:assets`'s `<Image />` for optimization. Static assets (favicons, downloadable files, JSON data, large gallery images) live in `public/` and are referenced by absolute URL.

### Versioning

`package.json` uses a calendar version (`YYYY.M.D`). The footer/home badge reads `process.env.npm_package_version` and links to a GitHub release tag of that version. Bumping the version requires: (a) a `CHANGELOG.md` entry under a new `## [YYYY.M.D]` heading, and (b) a matching GitHub release tag.
