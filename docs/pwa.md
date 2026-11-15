# Lightweight PWA

## Scope And Experience

eduStack remains an Astro static site on GitHub Pages. The PWA adds a convenient
home-screen entry and limited offline reading without an account or a backend.
Child profiles and the original reference snapshot keep their current roles.

| Feature | Ordinary browser | Installed PWA window |
| --- | --- | --- |
| Homepage installation entry | Visible, unless installation was just accepted | Hidden |
| Native installation dialog | Used when the browser supplies it | Not needed |
| Manual installation instructions | Safari on iPhone/iPad; browser menu elsewhere | Not needed |
| Offline and saved-copy notices | Available once the worker controls the site | Available |
| Version, Check for updates, new-version prompt | Hidden | Visible |
| External resources | Open another tab/window | Ask the system/browser to open another browsing context |

Use **Add to home screen / 添加到主屏幕**, without requiring parents to know the
term PWA. Never open the installation dialog automatically. If installation is
unavailable, explain browser options and bookmarking. A website cannot force a
particular external browser application or identical window behaviour across
platforms.

English and Chinese manifests share one stable app ID and scope, but open their
respective homepage when installed. The app name is eduStack. PNG icons and the
Apple touch icon derive from the existing leaf, with an opaque paper background
and padding suitable for maskable icons.

## Cache Boundaries

The build creates `sw.js` and `version.json`. Register the worker only for
production builds in a secure context. Localhost supports testing; a public IP
over ordinary HTTP does not support installation or service-worker features.
Development mode does not register a worker.

- Precache both homepages, bilingual offline pages, compiled CSS/JS, local
  fonts, icons/manifests and the main family/dinner illustrations.
- Fetch recognised site pages from the network first. On failure, a server
  error or a six-second timeout, return a saved page; otherwise return the
  offline page in the requested language.
- Keep at most 30 successful visited HTML pages per release. Strip query
  strings from cache keys; library search remains a browser-side filter.
- Serve precached dependencies and hashed compiled files from cache first.
  Fetch other eligible homepage illustrations from the network first, retaining
  at most 40 runtime asset entries per release. Do not cache arbitrary downloads.
- Keep the current and one previous release so open tabs can still request
  older hashed dependencies. Counts may therefore reach twice the per-release
  limits. The next activation removes older caches in this app's namespace.
- Bypass external requests, `/reference/`, `sw.js`, `version.json`, writes and
  private profile data. The worker does not read localStorage.

Saved HTML has a marker so it can state that content may be out of date even
when the device reports a working connection. Reconnection does not replace
what someone is reading. Source-check dates retain their original meaning.

Browser storage can be reclaimed; offline availability is best-effort. If saved
files have been reclaimed, return a minimal reconnect message. Cache-write
failures must not stop online reading. An incomplete core must not activate and
replace the working release.

## Updates In The PWA Only

1. Hash built current-site files and the worker template to obtain a release
   ID. Exclude the reference snapshot. Stamp each current HTML page with its own
   release so an old document remains distinguishable from a newer worker.
2. In standalone mode, check on opening, reconnecting and returning after at
   least 15 minutes. Also offer **Check for updates**. Use a network-only version
   request and `registration.update()` with `updateViaCache: none`.
3. Install the new core into a separate cache and let its worker wait. Never
   call `skipWaiting()` automatically. Only a ready release offers **Update now
   / Later**.
4. Before updating an edited form, ask the user to save. Activate the waiting
   worker and reload only the window whose user chose to update. Other windows
   are not forcibly refreshed; an older document can later offer its own reload.
5. Update CacheStorage only. Preserve localStorage and child profiles. Do not
   imply that installation adds cloud sync or backup.

Ordinary browser pages get fresh content on navigation and use the normal
service-worker lifecycle, but show no application version or update controls.
Never report "up to date" when offline. Distinguish connectivity failures from
an update still being prepared.

## External Links

Current-site resource, citation, book, educator and tool links use
`target="_blank"` and `rel="noopener noreferrer"`, with an accessible description
of the new browsing context. Internal links retain ordinary navigation. The
shared client applies the policy to dynamically added links, including profile
recommendations. Do not embed outside sites, proxy full texts or cache their
responses. Do not rewrite the original reference snapshot.

## Verification And Release

Run `npm run check` and `npm run build`. PWA unit tests cover the core/page
separation, reference exclusion, versioning, base paths, bypass rules, bounded
caches and missing-storage fallback.

Use a production build on localhost or HTTPS to check:

1. Manifest, icon sizes and installability; no update UI in ordinary browsers.
2. Native-prompt handling and manual instructions, including keyboard focus,
   Escape and closing the dialog, in English and Chinese.
3. Visited/unvisited pages offline, both fallback languages, saved-copy notices
   and explicit offline update-check messages.
4. A second release, Later, an edited form, accepted update, preserved profiles
   and a second window that was not forcibly reloaded.
5. An incomplete release failing to replace the working app.
6. External links including dynamic profile links, unchanged internal links,
   mobile layout and automated accessibility checks.

Local automated tests can simulate standalone mode and exercise real workers.
They do not replace actual installation tests on iPhone, Android and desktop.
The first production release needs an HTTPS smoke test; later releases need an
upgrade check.

## References

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [MDN: beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
