# Website Foundations

Established 2026-11-15 for the first development phase. This is a maintenance
specification, not a claim that later product phases are complete.

## Product And Page Responsibilities

eduStack is a resource and browser-tool collection for parents and caregivers,
organised around psychological development from birth up to the 18th birthday.
Emotions, relationships, self-regulation and practical family tasks take
priority. Health, learning and other useful resources remain in scope.

Psychological development is the internal framework for selecting sources,
organising stages and connecting topics. Public positioning uses ordinary
language about growing up, family life, reading and useful tools. Do not turn
the internal framework into a homepage slogan or make families learn academic
categories to navigate. Explain specialist terms when a particular topic needs
them, and preserve accurate source names and citations.

| Page | Responsibility now | Later work |
| --- | --- | --- |
| `/`, `/zh/` | General editorial homepage or selected local child's stage selections at the same address, with child switching, search and open browsing | Refine selections as reviewed content grows |
| `/ages/` | Five primary age groups, usable without a profile | Keep the simple age navigation |
| `/ages/{id}/` | Manually chosen stage homepages with a small selection of starting resources, classic reading, research context and tools; shows the local child's current stage when available | Keep manual browsing open and add reviewed stage selections |
| `/ages/{id}/guide/` | Full development, activities, idea roots, research and health guide, with a return link to stage selections | Maintain cited content incrementally |
| `/tools/`, `/tools/{id}/` | External tool directory and shared purpose, access, privacy and reading details; development candidates stay labelled | Individual browser tools |
| `/educators/` | Thinkers, ideas, original works and historical limitations | Add reviewed readings incrementally |
| `/topics/` | Existing topic explanations or clearly labelled pages under preparation | Add topics and suitable templates incrementally |
| `/library/` | Shared search across published books, classic readings, practical resources, guidelines, research, tools, thinkers and topics | Expand reviewed content and vocabulary as needed |
| `/resources/{id}/` | Type-specific reading guidance, summaries, scope, limits, source/version/access records and related entries | Gradually add source-specific metadata where missing |
| `/me/` | Local child profiles and age-based suggestions; explains out-of-range ages and keeps general browsing available | Add more reviewed profile-relevant content without collecting extra personal data |
| `/reference/` | Fixed original static design, including its page directory | Keep the snapshot unchanged |

The main menu order is Home, By age, Activities, Tools, Educators, Topics, Library.
My child remains in the header context, not the primary menu.
The homepage alone adds Search at the right edge. Reserve the same search
space on interior pages so the other links do not move between pages. Use equal
left and right columns to centre the main menu independently of Search. On
small screens, centre wrapped menu rows across the full width and place Search
in a separate row at the right; reserve that row on interior pages too.
Educators stays a first-level entry. Navigation translations use `ui.ts`.

## Public And Specialist Language

Choose the level of language by the reader's task: finding an entry, understanding
the content, or checking the evidence. Apply this to all supported languages,
metadata descriptions and tool instructions as well as visible page copy.

Entries explain the use, titles introduce the question, body text explains
concepts, and source information preserves technical accuracy.

| Location | Rule |
| --- | --- |
| Homepage introduction, menus and buttons | Use ordinary words describing what families can find or do; do not require knowledge of academic categories |
| Topic titles and recommendation cards | Start with a family question or concrete situation rather than naming every entry after a technical term |
| Summaries and instructions | Explain the situation or action first; introduce and explain specialist terms when they help understanding |
| Theory introductions and concept explanations | Use the correct term and explain its meaning, scope and boundaries |
| Sources, papers and guideline comparisons | Preserve accurate titles, populations, methods, versions, evidence types and limitations; translations may assist reading |
| Internal research and organisation | Use precise theoretical, developmental and methodological classifications |

Omit a term when it adds no useful understanding. Retain and explain it when
replacing it would change the meaning: secure attachment is not simply the
everyday idea that a child feels safe. Do not simplify a reported association
into proof of causation, or a possible benefit into a guaranteed improvement.
Keep age, region, population and use restrictions where they matter.

These are layers within a page, not a ban on terminology. For example, an entry
can say "Big feelings", a title can ask "How can we help when a child is angry?",
and the body can explain self-regulation. The research note must still identify
whether the study measured emotion regulation, attention control or another
specific construct. A theory page or an accurate resource title may itself
contain a specialist term.

For existing resource introductions, retain useful specialist terms and follow
them with a short explanation in ordinary language. Keep method labels precise
(for example, cross-sectional study) and explain them in readable text rather
than replacing them with an approximate label. Display evidence metadata as
an evidence type, not a quality ranking. Resource age tags guide parents'
reading choices; distinguish them from the source population. Identify an
editorial activity example as such instead of presenting it as an evaluated
intervention or a tested number of repetitions.

## Age And Classification Rules

`src/lib/taxonomy.mjs` records primary stage boundaries, development area keys
and bilingual resource topic labels. `npm run check:data` checks these values.

| Entry | Inclusive whole-month range | Display range |
| --- | --- | --- |
| `babies` | 0-11 | Birth to 1 year |
| `toddlers` | 12-35 | 1-3 years |
| `preschoolers` | 36-71 | 3-6 years |
| `school-age` | 72-143 | 6-12 years |
| `teens` | 144-215 | 12-18 years |

Display endpoints describe transitions: at 12 months the toddler group applies,
at 36 months the preschool group applies, and so on. At 216 months the child is
outside the current stage coverage. Age is a reading filter, not an ability
assessment. Resource ranges may be narrower than a stage or cross several
stages. They describe editorial relevance; `audience`, `whyAge` and `limits`
must preserve the actual population studied or covered by the source.

Development areas currently used in stage explanations:

| Key | Meaning |
| --- | --- |
| `social` | Social relationships |
| `emotional` | Emotional development |
| `language` | Language and communication |
| `thinking` | Cognition and learning |
| `movement` | Movement |
| `identity` | Identity and autonomy |
| `body` | Physical development |

Resource `topics` are question and subject tags, such as `attachment`,
`self-regulation`, `communication`, `sleep` and `learning`. They are distinct
from development areas and from published topic-page IDs. A tag can exist
before a dedicated topic page is written. Do not create empty topic pages
just to make every tag a page. New keys need labels and an editorial meaning
before use. Optional concern filters and resource-to-area tagging remain
future work; this phase does not add a questionnaire.

## Content Fields And Relationships

The implemented interfaces live in `src/lib/data.ts`.

Educator introductions distinguish a person's role, a family question, selected
works and the actual reading basis (`role`, `question`, `works`, `basis`). Every
work has a bilingual title, edition or reading note, and a resolvable citation.
`reviewed` records our editorial review, not a new external-source check or a
claim to have read the full work. Related research does not validate a whole
historical theory. Family examples are editorial interpretations. Missing
limitations are incomplete coverage, not evidence that a theory needs no
correction. Original-text links are access pointers, not a promise of global
public-domain status or reproduction rights. Work titles and family questions
are searchable; do not invent age limits for thinkers.

The educator directory defaults to birth year, earliest first, in static HTML
as well as in the browser. `birthYear` uses negative historical years for BCE,
positive years for CE and `null` for an unrecorded date; no year zero is used.
Approximate years remain approximate in the displayed `years`. Unknown years
stay last for either chronological order. `directions` are overlapping editorial
reading categories, not exclusive historical schools; the first direction
determines grouping when sorting by direction. `origin` is one associated
region for browsing, not nationality or an exhaustive account of activity.
The card retains its fuller region description. Classifications follow the
reviewed introductions and may be revised with evidence.

`educator-browse.mjs` defines bilingual directions/regions and shared sorting.
Directory controls also offer name and regional sorting plus intersecting
direction/region filters. Public URL keys are `sort`, `direction` and `region`;
only known values apply. Browser back/forward and language changes preserve
the selection; Reset returns to all thinkers in the earliest-first order.
Without JavaScript the complete chronological directory remains readable.

`stage-home.yaml` holds published bilingual editorial selections for each
published stage. Each resource or tool reference has a brief reason for its
inclusion. Starting points are guides or guidelines; reflection is a book or
classic reading; context is research or a guideline. Selected entries must be
published and overlap the stage, but that overlap does not make every activity
suitable for every age within the stage. Tool cards preserve their specific
inclusive year labels. Empty tool selections show an honest notice.

Optional stage `updates` are explicitly selected resources with a bilingual
reason and `selectedOn` editorial date. It is not a source publication,
revision or check date and does not establish that a work is new. No update
is currently selected; the stage template shows a brief empty state and keeps
existing research context available. Future additions are editorial decisions,
not an automatic feed sorted by check date. Use at most three selections per
section; the full filtered library remains accessible for open browsing.

Stage selection is by ordinary links and works without JavaScript, local
storage or a profile. It never implicitly reads or writes the current child.
The general homepage remains available. Deeper guide sections keep stable
`develop`, `together` and `health` anchors; old stage anchor destinations also
have links to the corresponding full guide sections.

| Field or group | Convention |
| --- | --- |
| `id` | Stable, lower-case hyphenated identifier; unique within each collection |
| `publicationStatus` | Required for every resource, stage, topic, educator, tool and daily tip |
| `type` | Resource kind: `book`, `classic`, `guide`, `guideline`, `research` |
| `title`, `summary` | Both English and Chinese; a concise original introduction, not copied source text |
| `by`, `url`, `year` / `yearNote` | Identify the source, author or body and original publication information |
| `minMonths`, `maxMonths` | Inclusive month ranges for resources, stages and tips |
| Tool `minAge`, `maxAge` | Existing inclusive year labels; keep distinct from month fields |
| `topics` | One or more keys in `resourceTopics`; currently on resources |
| `purpose`, `audience`, `limits`, `access`, `checkedNote` | What it solves, who can use it, limits, availability and what was checked; required for every published reading resource; record source-specific limits and the actual scope checked, including unresolved access |
| `region`, `sourceVersion` | Required for guidelines, optional for other readings; applicability and recorded edition, without claiming current-version verification; keep original publication, revision and check dates distinct |
| `language`, `free` | Source languages and free-reading status; do not imply that every linked book or paper is free |
| `checked` | Date source link and recorded details were actually checked |
| Stage/topic `updated` | Date editorial content changed; separate from source checks |
| `evidence`, `design`, `evidenceNote` | Existing evidence metadata; labels are not a universal reliability ranking |
| `sourceLinks`, `src` | Additional source URLs and claim-level source keys |
| Topic source `additionalResources` | Extra published resource IDs covering different source ages or documents; each is linked in the comparison column |
| `backedBy`, `research` | Research IDs supporting or contextualising a resource, stage or topic |
| `picks`, `reading`, `roots` | Editorial selections, further-reading books and educator connections |

Tools use their own collection and inclusive year labels. The shared search
converts these to inclusive months but preserves original year labels for
display. Tool `topics` and `relatedResources` connect readings and stages;
these links are not evaluations or endorsements. Required bilingual `purpose`,
`audience`, `limits`, `access`, `device`, `registration` and `checkedNote` explain use
and the scope actually checked. `verificationStatus` is `verified`, `partial` or
`unverified`; partial/verified records require a real `checked` date. A partial
check is not confirmation of untested accounts, fees or all current features.
Internal tools describe local implementation review separately from source checks.
Missing device, account, region or revision information stays explicitly
unrecorded. `languageCodes` may specify verified `en`, `zh`, `es` or `multi`;
multilingual without a recorded list does not imply every particular language.

The server-only `src/lib/search/index.ts` builds the public bilingual index
from filtered collections. Browser code imports only `engine.mjs`; it never
imports the raw YAML loader. URL parameters are `q`, `type`, `age`, `topic`,
`language`, `free=1` and `sort=newest`. Age accepts a stage ID or whole months
0-215; filters intersect. Unknown age/access/language does not satisfy a strict
filter. Thinkers and topic pages do not inherit an invented child age or source
publication year. Topic editorial update dates are not publication dates.

Keyword matching covers both languages, original titles, authors, topic labels
and a small editorial vocabulary. It is not a natural-language answer service.
Publication sorting leaves undated items last; core selections remain visible
in ordinary browsing. The library may use the selected local child's age as a
visible temporary filter. Explicit URL age conditions take priority; automatic
profile ages never enter the URL. Reset restores general browsing for the
current page. The language switch preserves public URL conditions.
Without JavaScript, every published entry remains a normal readable link.

The `sources.yaml` dictionary supports citations; it is not a draft store.
Add only source metadata suitable for publication. Research notes, downloaded
works, copyright assessments and product planning stay outside this repository.

## Publication States

`src/lib/publication.mjs` is shared by the data loader and validation scripts.

| State | Meaning | Generated on the website? |
| --- | --- | --- |
| `draft` | Work in progress; may have only ID and state | No |
| `in-review` | Candidate awaiting source, text, translation or rights review | No |
| `published` | Approved for public presentation | Yes |
| `needs-review` | Withdrawn pending rechecking after a material concern | No |

Only explicitly `published` items are exported by `data.ts`. Missing or unknown
states are excluded and fail validation. Nonpublished items are excluded from
generated routes, lists and browser data. References from published items must
point to other published items or to the public source dictionary. When
withdrawing an item, update its public dependencies as part of the same change;
the validator deliberately rejects unresolved references.

Topic `status: ready | preparing` describes the completeness of the public
topic explanation, independently of publication. A `published` and `preparing`
topic may show an honest progress notice and already checked related resources.
It must not present an unreviewed conclusion.

Existing visible content was migrated to `published` on 2026-11-15 to preserve
the current site. This does not mean sources were newly checked or rights were
reassessed that day. Original source-check and update dates stay intact.

States control the website build, not access to a public Git repository or its
history. Never put private records or restricted full texts in content files.
The fixed reference snapshot is deliberately outside this current-content
lifecycle and remains unchanged.

Before publishing, check source and version, relevance, scope, evidence limits,
reuse conditions, original wording, translations and links. A successful link
request alone is not a completed editorial review. Classic ideas are stable;
guidelines need version checks; research and trends need frequent discovery
with selective publication. Do not label an old work as new research because
it was recently added to eduStack.

## Visual And Accessibility Baseline

Keep the warm editorial direction, existing illustrations, paper background,
dark teal text, restrained rust accents and generous reading space.

| Role | Token | Default size |
| --- | --- | --- |
| Source and secondary note | `--type-note` | 0.875rem / 14px |
| Navigation, controls and short guidance | `--type-ui` | 1rem / 16px |
| Body and summaries | `--type-body` | 1.125rem / 18px |
| Section heading | `--type-section` | 1.5rem / 24px |
| Feature heading | `--type-feature` | 2rem / 32px |
| Brand only | `--type-wordmark` | 3rem / 48px |

Use `EditorialSerif` for headings and `ReadingSans` for body and controls. Reuse
the five content sizes; mobile layouts wrap rather than shrink text. Body,
heading and note line heights are 1.8, 1.55 and 1.65. Paragraphs use start
alignment and a width near 40 CJK characters. Do not add fixed text-box heights.

Shared tokens, masthead and navigation live in `site.css` and `SiteHeader.astro`.
Homepage composition lives in `editorial.css`; interior cards, buttons and
reading components in `global.css`. Use borders and spacing before adding new
card decoration. Keep independent controls at least 2.75rem high as a project
comfort target. Use labelled inputs, visible keyboard focus, meaningful link
text, heading order, image alternatives and a working skip link. Current-page
navigation has an underline as well as colour.

Target WCAG 2.2 AA: normal text contrast 4.5:1, large text and meaningful
non-text UI contrast 3:1, 200% text resizing and 320 CSS-pixel reflow, keyboard
access, text-spacing tolerance and reduced-motion support. WCAG does not
prescribe a universal minimum font size or require every AA target to be 44px.
Automated checks do not establish complete conformance.

Local fonts use head preloads and a bounded `font-display: block` period to
reduce the visible font changes previously reported. System fallbacks remain
necessary on slow or failed requests. Check glyph coverage when changing copy;
font licensing files stay beside the assets.

## Static Architecture And Language Boundaries

Astro builds static HTML and GitHub Pages serves `dist/`. Search, filters and
profile context run in the browser. Profiles stay in localStorage on the current
browser; the existing profile code can transfer them manually. Clearing storage
may erase them. The homepage, stage pages, library and tool directory
may read the selected local profile, but no profile value is
written into generated HTML, search indexes or URLs. Do not promise cloud
accounts, automatic device sync, online AI or server tasks.

### Profile Context And Filtering

The profile is an optional convenience layer. A visitor without a profile gets
the same public pages and can browse by age, topic or keyword. A saved child
selects the main homepage content for the current stage and adds a current-child
context on stage, guide, library and tool pages. The context is hidden when local
storage is unavailable or contains no valid selected child.

### Homepage Modes And Quick Switching

The root address stays `/` or `/zh/` in both modes. `PersonalHome.astro` reuses
published `stage-home.yaml` selections for starting readings, classics, tools
and research. Public cards are rendered at build time; browser code selects the
stage and checks each card's inclusive month range against the current child.
Only age-matching selections are shown, with honest empty states and original
source dates. Unselected stages and general feature sections stay hidden.
Do not invent recent additions or call older research new because it was added
or checked recently. The general homepage remains the no-script fallback.

`edustack.home-view.v1` stores only `child` or `general`, independently of the
existing profile selection. A valid in-range profile defaults to child mode;
choosing General homepage keeps all profiles and the selected child intact.
The mode persists across reloads and language switching. Selecting a child on
the homepage returns to child mode. Missing, invalid, unavailable or out-of-range
profiles use general content, with an explanation where needed. Mode-write
failure permits a temporary page view but explains that it could not be saved.
Deleting all profiles resets the mode preference when storage permits.

The header context offers buttons for up to three children and a labelled select
for four or more. Nicknames are optional; stable numbered labels distinguish
unnamed children. Successful selection updates the local profile and dependent
views without adding identity or age to the URL. Failed selection retains the
previous child. Profile management uses its own existing child list rather than
duplicating header controls. Storage events refresh open tabs; profile management
also discards stale edits and transfer codes so an old form cannot resurrect
profiles deleted elsewhere. Tools clear personal status text when profiles vanish.

General anchors `#ages`, `#topics` and `#reading` explicitly expose general content
for that visit. Returning to a child clears those anchors and refreshes language
links. Ordinary stage pages always describe their URL's stage; switching children
updates the context without silently navigating to another stage or overriding
an explicit library age filter.

Only the recommendation area waits briefly for local selection on initial load,
with a bounded fallback if the module fails. Shared navigation, search, PWA
controls and source/privacy information remain available in both modes. Personal
mode condenses the trust section and replaces the fixed feature, age grid, topics
and book shelf; it does not append personalised cards above unchanged general
recommendations. The installation panel follows the personal recommendations;
in general mode it retains its place before the main public feature.

The current implementation uses only month and year of birth, an optional
nickname/identifier and an optional sex field. Sex is used only for the
age-specific puberty resources already marked in the data. It is not a general
personalisation or assessment signal. Up to six children can be edited,
selected, removed, exported or imported locally.

Automatic age filtering is deliberately temporary: it uses the selected child's
whole-month age, does not change the URL, and shows the active condition.
`src/lib/search/profile.mjs` keeps public conditions separate from this age.
Changing keywords, type, topic, language, access or sort keeps the age local.
Only directly selecting an age makes it a public URL condition. Selecting any
age or resetting disables automatic age for the current page, including later
profile-change events. The library serializes an explicit general choice as
`age=any`, so reload and language switching retain it without exposing a profile age. Visitors can also view all tools. Stage links remain
ordinary static links, so a visitor can inspect a
different stage while the context explains the selected child's stage.

The primary stage range is inclusive from 0 through 215 months. At 216 months
and above, `/me/` keeps profile editing and general library/tool access but
shows an explicit out-of-range state instead of assigning the last stage. A
missing match in the tool directory has an honest empty state. The library
explicitly reports an out-of-range profile and omits automatic age filtering.
Profile values
must never be interpolated into page paths, query strings, public data files,
analytics, logs or build-time content.

Saved profiles, imports and writes share `normalizeStore` validation: version,
at most six children, unique safe IDs, integer birth month/year no later than
the current month, valid optional fields and a repaired selection pointer.
Invalid data falls back to public browsing without overwriting the original
stored value; the profile page explains how to recover. Profile IDs and names
are written using DOM properties and text content, never parsed as HTML.

Writes and deletion report success only after localStorage succeeds. On
failure the previous state is retained, no profile-change event is emitted,
and the profile page displays an actionable message. Successful deletion also
clears the displayed transfer code, edit form and rendered personal context.
Transfer codes are Base64-encoded JSON, not encryption; users control copies
already exported or copied outside the page.

English is the default (`/`); Chinese equivalents use `/zh/`. Languages and
prefixes live in `languages.ts`; UI and homepage strings have their existing
translation files. New languages need content, route and glyph coverage work.
The language switcher preserves equivalent routes and query/anchor state.

The original design stays at `/reference/`; the historical blog is a separate
deployment. Do not rewrite the snapshot or package raw download archives,
research or private profiles into the website deployment.

## Checks Before A Release

1. Run `npm run check` (includes data validation and publication regression tests).
2. Run `npm run build`; check the generated output, including draft exclusion.
   Run `npm run test:built` after building: it checks public search routes,
   local links/assets/anchors, external-link attributes, PWA metadata, and an
   isolated real build with unpublished fixture records. `npm run check`
   includes search, content and PWA logic tests; these do not replace browser
   checks on the actual build. Full external-link requests are a separate
   maintenance task (`npm run check:links`).
   For profile changes, also run `npx playwright install chromium` once and
   `npm run test:profile:browser` against the final `dist/`. If using an existing
   Chromium installation, set `PLAYWRIGHT_EXECUTABLE_PATH` to its executable.
   The suite serves the actual build locally and uses isolated contexts with
   synthetic records to test bilingual imports, filtering, storage failures
   and clearing. It does not verify a real mobile installation.
3. Inspect English and Chinese homepages and representative interior pages at
   desktop, mobile and 320px widths; test text resizing and spacing.
4. Check menu positions, keyboard navigation, search, age and tool entries,
   language switching, source dates and any changed links.
5. Confirm the reference snapshot did not change. Publish only website files.

Phase-one completion establishes the framework and rules. It does not require
every topic, tool or resource to be written. Phase three provides manually
selected stage homepages; phase four adds the optional local profile context
and consistent automatic filtering without changing the static architecture.

## Lightweight PWA

Installation, limited offline reading and release updates use the static build
and a service worker; they do not add accounts or a backend. See [PWA](pwa.md)
for cache limits, upgrade behaviour and verification. Application version and
update controls appear only in an installed standalone window. The homepage
offers installation with manual help. External resources open another tab or
browser context; internal navigation stays in the current window.

## Activities And Content Relationships

The content-structure work between phases four and five adds original activities,
optional explanatory sections and activity/tool selections to topics, and activity
and topic selections to stage homes. See [Content data](content-data.md) for the
file inventory, fields, IDs, relation ownership and editing rules.

`/activities/` and `/activities/{id}/` (with Chinese equivalents) provide static
instructions and age/time/setting filtering. They are discoverable from existing
pages and the shared primary menu under Activities. Filters use inclusive months; explicit
public age conditions override local profiles. `age=any` preserves an explicit
choice to browse all ages without exposing a child's age. The selected child's
age remains local and updates on profile changes. No match has an honest empty
state. Without JavaScript the full published list and details remain readable.

Activities are editorial designs, with source-specific notes distinguishing
general principles from evidence of an evaluated activity. They need no tool;
only available published tools may be linked. Topic comparison tables remain
optional, and their original source limitations must remain intact. Short tips
and stage-guide suggestions are not automatically upgraded to activity records.
The activity release and draft exclusion use the existing publication boundary.
Activity dates refer to publication here, rather than the cited source's date.

## Shared Guidance And Content Integrity

Stage health facts and the daily-routine tool share the sourced, inclusive
month rules in `src/lib/daily-guidance.mjs`. Select sleep, movement and screen
rules independently: WHO movement guidance changes at five, AASM sleep
guidance at six and thirteen, and young infants need month precision.
Stage cards show the age-specific values and linked sources. Tool inputs must
distinguish missing values from zero and validate required fields and ranges.
BMI uses height and weight only; age and sex are optional recording details.

Internal tool names and descriptions come from `tools.yaml`. Their operation
pages use `ToolContext.astro` for design limits, linked reading, activities,
stages and the recorded review scope. Original observation prompts are not
age-specific milestones or validated screening instruments.

Tool controls start inside a disabled fieldset and become available only after
their script has initialised; a readable explanation remains when scripting is
unavailable. Saved tools mark new edits as unsaved, keep that state on storage
failure and use the browser's leave warning for navigation, refresh and language
changes. Restoring a task must confirm replacement of an unsaved draft. Dynamic
step operations preserve focus by step ID, falling back to the adjacent step
after deletion or its text field if an action becomes disabled.

`client.ts` forwards relevant local-storage events to `edustack:profilechange`;
individual consumers must not install additional storage-to-profile bridges.
Handle profile, homepage-mode and whole-storage clearing events, ignore other
keys and session storage, and preserve explicit public filters. A tool save must
not rebuild the child menu. Long names wrap inside the header and its popup.

Tools offer direct section links and expandable selection criteria. Comparison
tables keep their row/column semantics inside a labelled, focusable scrolling
region. Tool printouts omit site navigation and footer, retain record context
and limits, and include the selected observation age band as text.

After building, run `npm run test:frontend:browser` for the bilingual interaction
regressions, including cross-tab clearing, dirty drafts, keyboard focus, long
names, 320px/200% text, print media and unavailable JavaScript. The Playwright
executable override described in the release checks also applies. These tests
do not replace real-device, screen-reader or installed-PWA acceptance.

Educator search topics are explicit editorial tags, independent of citation
storage and historical reading directions. Related resource suggestions must
share a topic and overlap ages, with stable ordering independent of YAML order.
`age-label.mjs` labels inclusive ranges without adding an excluded birthday;
the five broad navigation transition labels retain their established wording.

External link maintenance deduplicates all recorded public URLs and separates
internal routes, invalid values and HTTP access restrictions. Its date or a
successful request does not establish an editorial, clinical or rights review.
