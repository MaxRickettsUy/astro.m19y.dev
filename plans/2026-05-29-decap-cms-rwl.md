# Decap CMS for RWL Plan

**Date:** 2026-05-29
**Scope:** Add Decap CMS editing for RWL link data on astro.m19y.dev, starting with books and articles.

---

## Goal

Make RWL links editable from a browser-based admin UI instead of editing source files directly.

The first useful version should let an authenticated user edit:

- `public/rwl.json` for RWL book links and statuses.
- `public/articles.json` for RWL article links and archive links.

Decap CMS should commit changes back to the Git repository, which should trigger a normal Netlify rebuild.

---

## Current State

- The site is Astro 6 + Tailwind 4 and deploys on Netlify.
- `netlify.toml` currently sets `NODE_VERSION = "22"` and HSTS headers only.
- RWL book data now lives in `public/rwl.json`.
- RWL article data now lives in `public/articles.json`.
- RWL pages import those JSON files directly:
  - `src/pages/rwl/2021.astro`
  - `src/pages/rwl/2022.astro`
  - `src/pages/rwl/2023.astro`
  - `src/pages/rwl/2024.astro`
- `/admin` is implemented in `src/pages/admin.html`.
- Decap config is implemented in `public/admin/config.yml`.
- `local_backend: true` is enabled for local CMS testing with `decap-server`.

---

## Implementation Status

- [x] Add the `/admin/` Decap shell.
- [x] Add `public/admin/config.yml`.
- [x] Configure local backend support.
- [x] Add `npm run cms` for the local Decap proxy.
- [x] Model `public/rwl.json` in Decap.
- [x] Model `public/articles.json` in Decap.
- [x] Add `public/uploads/.gitkeep` for the configured media folder.
- [x] Verify `npm run build`.
- [x] Verify `/admin/` loads locally.
- [x] Verify local proxy login and editable RWL entries.
- [ ] Configure Netlify Identity in the Netlify dashboard.
- [ ] Enable Git Gateway in the Netlify dashboard.
- [ ] Verify a production CMS save creates a Git commit.

---

## Approach

Use Decap CMS as a static admin app served at `/admin/`.

Decap is a Git-based CMS. In production, it will authenticate through Netlify Identity + Git Gateway, then write commits to the configured branch. The content remains plain JSON in the repo.

Reference docs:

- Astro Decap CMS guide: https://docs.astro.build/en/guides/cms/decap-cms/
- Decap configuration docs: https://decapcms.org/docs/configure-decap-cms/
- Decap Git Gateway docs: https://decapcms.org/docs/git-gateway-backend/
- Netlify Git Gateway docs: https://docs.netlify.com/manage/security/secure-access-to-sites/git-gateway/

---

## Implementation Plan

### PR 1 - Add the Admin Shell

**Files:** `src/pages/admin.html`, `public/admin/config.yml`

- Add `src/pages/admin.html`.
- Include `noindex` metadata.
- Link Decap to `/admin/config.yml` with `rel="cms-config-url"`.
- Include the Netlify Identity widget script.
- Include the Decap CMS script from the official CDN.
- Add a minimal `public/admin/config.yml` with:
  - `backend.name: git-gateway`
  - `backend.branch: main`
  - `media_folder: public/uploads`
  - `public_folder: /uploads`

Initial `admin.html` shape:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="/admin/config.yml" type="text/yaml" rel="cms-config-url" />
    <title>Content Manager</title>
  </head>
  <body>
    <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
    <script src="https://unpkg.com/decap-cms@^3.1.2/dist/decap-cms.js"></script>
  </body>
</html>
```

Run `npm run build` and verify `/admin/index.html` is generated.

### PR 2 - Model `public/rwl.json`

**Files:** `public/admin/config.yml`, possibly `public/rwl.json`

Add a file collection for `public/rwl.json`.

There are two possible data shapes:

1. Keep the current year-keyed object.
2. Convert `rwl.json` to a Decap-friendlier list of years.

Recommended: convert to a list before adding Decap fields. Decap can edit year-keyed objects, but every year has to be declared separately in `config.yml`. A list scales better for adding new years.

Recommended shape:

```json
[
  {
    "year": "2024",
    "books": [
      {
        "label": "Extreme Ownership: How U.S. Navy SEALs Lead and Win",
        "href": "https://us.macmillan.com/books/9781250183866/extremeownership",
        "inProgress": true
      }
    ]
  }
]
```

Astro usage would change from:

```astro
{rwl["2024"].books.map((book) => <BookLink {...book} />)}
```

to:

```astro
const rwlYear = rwl.find((entry) => entry.year === "2024");
```

Then:

```astro
{rwlYear.books.map((book) => <BookLink {...book} />)}
```

Decap fields:

- `year`: string
- `books`: list
- `books.label`: string
- `books.href`: string
- `books.wiki`: boolean, optional
- `books.inProgress`: boolean, optional
- `books.complete`: boolean, optional
- `books.audiobook`: boolean, optional
- `books.thoughts`: list of strings, optional

Run `npm run build`.

### PR 3 - Model `public/articles.json`

**Files:** `public/admin/config.yml`, possibly `public/articles.json`

Add Decap editing for article links.

As with `rwl.json`, consider converting the current year-keyed object to a list of year entries:

```json
[
  {
    "year": "2024",
    "articles": [
      {
        "label": "Example Article",
        "href": "https://example.com/article",
        "archive": "https://web.archive.org/example"
      }
    ]
  }
]
```

This makes Decap configuration reusable and avoids adding a new object field every year.

Decap fields:

- `year`: string
- `articles`: list
- `articles.label`: string
- `articles.href`: string
- `articles.archive`: string

Update RWL pages to find articles by year if the JSON shape changes.

Run `npm run build`.

### PR 4 - Production Authentication

**Netlify dashboard steps:**

- Enable Identity for the site.
- Set registration to invite-only.
- Invite the owner/editor email.
- Enable Git Gateway.
- Confirm Git Gateway is connected to the repo provider.
- Deploy the site.
- Visit `/admin/`.
- Log in with the invited Identity account.
- Make a small test edit.
- Confirm Decap creates a commit on `main`.
- Confirm Netlify rebuilds and publishes the change.

Keep registration invite-only unless there is a specific reason to support open signups.

### PR 5 - Editorial Polish

**Files:** `public/admin/config.yml`

Once the basic edit/commit loop works:

- Add helpful field hints.
- Add field patterns for URLs where useful.
- Add collapsed summaries for list items, such as `{{label}}`.
- Consider `publish_mode: editorial_workflow` only if drafts/review are useful. For a personal site, direct commits to `main` are probably simpler.
- Consider Decap preview templates later. They are not required for the first version.

---

## Suggested First `config.yml`

This version keeps the current year-keyed `rwl.json` shape so the first PR can be smaller. It only models 2024 as a proof of concept.

```yaml
backend:
  name: git-gateway
  branch: main

media_folder: "public/uploads"
public_folder: "/uploads"

collections:
  - name: "rwl"
    label: "Read Watch Listen"
    files:
      - name: "rwl_links"
        label: "RWL Links"
        file: "public/rwl.json"
        format: "json"
        fields:
          - label: "2024"
            name: "2024"
            widget: "object"
            fields:
              - label: "Books"
                name: "books"
                widget: "list"
                summary: "{{fields.label}}"
                fields:
                  - { label: "Label", name: "label", widget: "string" }
                  - { label: "URL or Wikipedia Slug", name: "href", widget: "string" }
                  - { label: "Wikipedia Slug", name: "wiki", widget: "boolean", required: false }
                  - { label: "In Progress", name: "inProgress", widget: "boolean", required: false }
                  - { label: "Complete", name: "complete", widget: "boolean", required: false }
                  - { label: "Audiobook", name: "audiobook", widget: "boolean", required: false }
```

Use this only as a starter. Before adding all years, decide whether to convert the JSON to list-based year entries.

---

## Verification Checklist

- `npm run build` succeeds.
- `npm run cms` starts the Decap local proxy on port 8081.
- `/admin/index.html` appears in `dist`.
- `/admin/config.yml` appears in `dist/admin/config.yml`.
- Local `/admin/` loads the Decap app.
- Production `/admin/` shows a login prompt.
- Invited user can log in.
- Saving an RWL edit commits to the repo.
- Netlify deploy starts after the commit.
- Edited RWL link appears on the public page after deploy.

---

## Open Decisions

1. Keep the current year-keyed JSON files, or convert them to Decap-friendlier year lists?
2. Should Decap edit books/articles only, or also album notes later?
3. Should saves commit directly to `main`, or use Decap editorial workflow?
4. Should `/admin/` use the CDN Decap script, or install `decap-cms-app` as a package?

Recommendation:

- Convert JSON to list-based year entries before modeling every year in Decap.
- Start with direct commits to `main`.
- Use the CDN script first; switch to the package only if customization becomes useful.
