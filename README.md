# eduStack

Source-based parenting resources and tools, centred on psychological development
from birth up to the 18th birthday. English and Simplified Chinese.

The official brand spelling is **eduStack**. Historical reference pages retain
their original branding as part of the fixed snapshot.

eduStack provides short editorial introductions and links to selected resources:

- **Classic books** on raising and educating children
- **Guidelines** from authoritative bodies (WHO, UNICEF, national health departments, paediatric associations)
- **Research** in peer-reviewed journals
- **Practical resources and classic readings**, with scope, uses and limitations
- **Learning websites and tools**, with external tools available now and possible browser tools clearly marked as planned

Library resources identify their source, age range, evidence label and source-check
date. Introductions preserve source limits and distinguish ideas, guidelines and
research. There are no ads or accounts; child profiles stay in the parent's
browser. The ordinary homepage offers public editorial selections and does not
yet personalise itself from a saved profile.

Page responsibilities, shared design rules, age boundaries, content fields and
publication states are specified in [Website Foundations](docs/site-foundations.md).

## Run locally

Use Node.js 22.12 or newer (Node 22 is pinned in `.nvmrc`). Run these commands
from the Astro project root (the `code/` directory in the local workspace):

```sh
npm ci
npm run dev          # http://localhost:4321
npm run check        # Astro/TypeScript diagnostics and data validation
npm run build        # static site in dist/
npm run preview      # serve the production build locally
npm run check:data   # validate the data files
npm run test:content # publication filtering and validation regression checks
npm run test:pwa     # PWA versioning, cache boundaries and fallback checks
npm run check:links  # check every link still answers
```

For access from another machine, run `npm run dev -- --host 0.0.0.0`.
The editorial homepage defaults to English at `/`; Simplified Chinese is at
`/zh/`. `/en/` redirects to `/`. English content pages retain their existing
unprefixed paths, with Chinese equivalents under `/zh/`. The language switcher
opens the equivalent page in the selected language.

Supported languages and URL prefixes are configured in `src/i18n/languages.ts`.
Homepage text lives in `src/i18n/editorial.ts`, shared interface text in
`src/i18n/ui.ts`, and content translations in `src/data/`. To add a language,
provide its translations and page routes, then add it to the language registry;
the shared switcher and language metadata use that registry. English remains
the default; browser preferences do not override it automatically.

No environment variables are needed locally. For deployment, copy `.env.example`
to `.env` and set `SITE_URL` to the public site origin and `BASE_PATH` to the
deployment subdirectory (or `/`). Environment variables supplied by CI take
precedence. Restart the development server after changing `.env`.

The sibling `Edustack preview/` directory is an older exported build. The current
site is generated from `src/`, and `dist/` is recreated by `npm run build`.

The complete original static design is permanently available at `/reference/`
(Chinese: `/reference/zh/`; all 126 pages: `/reference/pages/`). Its files live in
`public/reference/` and are copied unchanged during builds. See
[`docs/original-design-reference.md`](docs/original-design-reference.md) for
snapshot provenance and isolation details. Keep this snapshot fixed while
redesigning the current site in `src/`.

## Where things live

Only website source, assets (including the fixed reference site), build and
deployment configuration, licences, and website maintenance files belong in
this repository. Keep original download archives, design research, migration
notes, and generated research drafts in the local workspace. GitHub Pages
publishes only `dist/`, not the repository's source or maintenance documents.

| Path | What |
| --- | --- |
| `src/data/resources.yaml` | The library. Rules for each field are at the top of the file. |
| `src/data/stages.yaml` | The five age-stage pages (at most six picks each). |
| `src/data/topics.yaml` | Topic pages: bottom line plus positions side by side. |
| `src/data/tips.yaml` | "One thing to try today", each tied to a resource. |
| `src/data/tools.yaml` | Free learning tools, kept separate from the library. |
| `src/lib/publication.mjs` | Only explicitly published content reaches routes, lists and browser data. |
| `src/lib/taxonomy.mjs` | Primary age boundaries, development areas and bilingual resource topic labels. |
| `src/i18n/ui.ts` | Interface text in both languages. |
| `src/views/` | Page templates; `src/pages/` and `src/pages/zh/` are thin wrappers. |

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. In the repository settings, set Pages to deploy from GitHub Actions. `.github/workflows/check-links.yml` checks every link on the 1st of each month.

The production repository is `eduStack/edustack.github.io`, bound to
`https://www.edustack.org/`. CI builds with that site origin and `/` as the base
path. The historical blog lives separately in `eduStack/edustack-archive`,
published from `master` at `https://archive.edustack.org/`.

The editorial homepage is `src/views/EditorialHome.astro`. The homepage and
interior pages share `src/components/SiteHeader.astro` and `src/styles/site.css`
for branding, colours, type sizes and responsive navigation. Homepage-specific
styles live in `src/styles/editorial.css`; interior components use
`src/styles/global.css`. Local fonts and illustrations are in `public/editorial/`.
Links and search use native same-origin URLs.

The local Noto fonts are subsets. `src/styles/font-coverage.css` adds characters
used by the interior pages beyond the original homepage subset. When adding
Chinese content, check glyph coverage and extend these font assets as needed;
font licences are stored alongside the files.
`src/components/FontPreloads.astro` starts font requests in the document head;
the font faces use a bounded blocking period to reduce visible font swapping.

## Licence

Code: MIT. Summaries in `src/data/` are short descriptions written by the editors; the linked works belong to their authors and publishers.
