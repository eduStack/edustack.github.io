# Original design reference

The fixed reference website is published at `/reference/`. It contains all 126
HTML pages and six assets from the original `Edustack preview/` static export,
before the Astro restoration and editorial redesign.

- English original home: `/reference/`
- Chinese original home: `/reference/zh/`
- Directory of all original pages: `/reference/pages/`

The main site's English and Chinese footers link to the matching reference
homepage. Every reference page includes a notice, a link to the full directory,
and a link back to the current website.

## Publication

`public/reference/` is a committed static snapshot. Astro copies it unchanged
into `dist/reference/` on every build. It has no separate build and does not use
the current site's components, styles, or translations. Keep this directory
fixed while changing the current website in `src/`.

Original relative page, asset, language-switch and search URLs remain inside
the reference directory. The only publication adaptations are the reference
notice and stylesheet, `noindex, nofollow` metadata, canonical URLs within the
reference directory, removal of website open-source claims and source-code
footer links, and an isolated browser storage key:
`edustack.reference.profiles.v1`. The original key `edustack.profiles.v1` remains
reserved for the current site. Reference pages retain the original external
font and source links, so those resources still require network access.

`public/reference/snapshot-manifest.json` records the SHA-256 hashes of the
original and published versions of every original file. The directory and
reference notice stylesheet are additions to that list.

The workspace's original `Edustack preview/` directory and ZIP remain untouched.
Git records the published snapshot and subsequent changes to the current site.
Do not regenerate the reference from current Astro output or delete it when
redesigning a page.
