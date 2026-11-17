# Content Data And Relationships

Maintenance dictionary, established 2026-11-17. The executable contracts are
`src/lib/data.ts`, `src/lib/taxonomy.mjs`, `src/lib/publication.mjs` and
`scripts/validate-data.mjs`. Change interfaces, validation and this dictionary
together. Requirements below describe publishable entries; the validator checks
many semantic constraints but is not a complete runtime schema for every field.
Read [Website Foundations](site-foundations.md) for product and display rules.

## Files And Authority

All paths in this table are relative to the website repository. YAML files are
the authoritative content; do not manually edit a generated index instead.

| File | Identity and responsibility |
| --- | --- |
| `src/data/resources.yaml` | Resource IDs; books, classic readings, practical guides, guidelines and research |
| `src/data/sources.yaml` | Mapping of source keys to public citation metadata, with no publication state |
| `src/data/educators.yaml` | Educator IDs; reviewed introductions, works and limitations |
| `src/data/tools.yaml` | Tool IDs; external services, access and privacy pointers |
| `src/data/topics.yaml` | Topic-page IDs; comparisons or editorial explanations and selections |
| `src/data/stages.yaml` | Stage IDs; full development and reading guides |
| `src/data/stage-home.yaml` | Same stage IDs; a separate editorial selection record for each stage |
| `src/data/tips.yaml` | Tip IDs; short suggestions tied to a resource |
| `src/data/activities.yaml` | Activity IDs; complete original practice instructions and source limits |
| `src/lib/search/index.ts` | Build-time adapter deriving the public bilingual search index from published collections |
| `src/lib/search/types.ts` | Generated search-entry contract, not an additional content store |

Stages, stage selections, tips and citation-only sources do not become independent
search entries. Search includes resources, tools, educators, topics and activities.
Browser code uses the filtered index and search engine; it must not import raw YAML.

## Shared Field Conventions

`R` means required by the interface for a published item; `O` means optional;
`C` identifies a conditional requirement. Required lists may be empty unless a
minimum is stated. Omitted optional lists mean no recorded entries, usually
consumed as `[]`; this does not establish that no relationship exists. Omitted
optional text means unrecorded and must be omitted or labelled honestly by the
template. There is no generic automatic text, age, date or translation default.

| Type or field | Meaning, allowed values and missing behaviour |
| --- | --- |
| `id: string` (R) | Stable lowercase ASCII words separated by hyphens, e.g. `small-project-plan`; unique within its collection |
| `publicationStatus` (R) | `draft`, `in-review`, `published`, `needs-review`; see publication boundary below |
| `L10n` | `{ en: string, zh: string }`; both nonempty, substantively equivalent, original editorial text |
| `L10nList` | `{ en: string[], zh: string[] }`; nonempty text lists when supplied; corresponding activity steps must have equal counts |
| `Claim` | `{ en: string, zh: string, src: string }`; a bilingual claim and its resolvable citation |
| Date | Genuine calendar date in `YYYY-MM-DD`, preferably quoted in YAML; the loader normalises YAML dates to text where defined |
| URL | Public HTTPS source/access pointer; a link does not establish permission to reproduce |
| `minMonths`, `maxMonths` | Integer inclusive whole-month bounds, `0 <= minMonths <= maxMonths <= 215`; required where listed |
| Topic tag list | Keys from `resourceTopics` in `taxonomy.mjs`; no inference that a tag has a corresponding topic page |

Identifiers, source names, original titles, DOI/ISBN, URLs, enum keys and years
are language-neutral unless explicitly marked `L10n`. A source may be in one
language while its eduStack introduction has both languages. No implicit
fallback translates a missing Chinese or English editorial field.

## Resource Fields

| Fields | Requirement, type and meaning |
| --- | --- |
| `id`, `publicationStatus` | R; shared conventions |
| `type` | R; `book` (book reading), `classic` (historical work/idea reading), `guide` (practical resource), `guideline` (formal guidance), `research` (study or synthesis) |
| `evidence` | R; `guideline` (authoritative guideline), `large` (large study/systematic synthesis), `small` (single small study), `expert` (opinion/consensus/book); descriptive legacy categories, not universal quality scores |
| `design` | C for research only; `meta-analysis`, `review`, `trial`, `cohort`, `experiment`, `observational`, `cross-sectional`, `large-dataset` |
| `title`, `summary` | R, L10n; title and independently written introduction |
| `originalTitle` | O, nonempty string; original title for identification/search |
| `by` | R, string; author or responsible organisation |
| `year` | R, integer or `null`; source publication year, not date entered in eduStack |
| `yearNote` | O, L10n; required when year is unknown; source dating/edition explanation, overrides numeric year display |
| `url` | R, HTTPS; original source or reliable access record |
| `doi`, `isbn`, `publisher` | O, strings; ISBN and publisher required for `book`; DOI identifies a study, not a licence |
| `evidenceNote` | O, L10n; source-specific evidence or reading limits |
| `language` | R, string; recorded source-language description |
| `languageCodes` | O, nonempty string list from `en`, `zh`, `es`, `multi`; verified source languages; search otherwise derives limited codes from the recorded language description |
| `region`, `sourceVersion` | O, L10n; jurisdiction/population and actual source edition/revision notes |
| `free` | R, boolean; recorded free-reading access, not reuse permission |
| `minMonths`, `maxMonths`, `sex` | R; inclusive editorial relevance range and `all`, `male`, `female`; sex specificity is for relevant growth/puberty content |
| `topics` | R, nonempty tag list; subject/question tags |
| `core` | O, boolean; editorial priority; absent behaves as false |
| `whyAge` | O, L10n; why the editorial age range is useful; preserve actual source population |
| `keyPoints`, `actions` | O, L10nList; source-grounded points and practical implications in our own words |
| `purpose`, `audience`, `limits`, `access`, `checkedNote` | O, L10n; required for `guide` and `classic`; explain use, intended reader, limitations, access conditions and what was checked |
| `sourceLinks` | O, `{ label: L10n, url: HTTPS }[]`; additional public evidence/version/access links |
| `checked` | R, date; when recorded source details and link were actually checked |
| `backedBy` | O, resource ID list; published research explaining evidence behind this entry |
| `type` | R; `book` (book reading), `classic` (historical/classic reading), `guide` (practical resource), `guideline` (institutional recommendation), `research` (study/review) |
| `evidence` | R; `guideline` (authoritative guideline), `large` (large study/systematic synthesis), `small` (single small study), `expert` (expert opinion, consensus or book); an evidence category, not a universal quality score |
| `design` | C for research only; `meta-analysis`, `review`, `trial`, `cohort`, `experiment`, `observational`, `cross-sectional`, `large-dataset` |
| `title`, `originalTitle`, `by` | R L10n title and string author/body; O nonempty string original-language title, searchable without replacing bilingual labels |
| `year`, `yearNote` | R number or explicit `null` source-publication year; O L10n qualification, required if year is unknown; yearNote takes display precedence |
| `url`, `doi`, `isbn`, `publisher` | R HTTPS source URL; O string identifiers/publisher; ISBN and publisher required for books; ISBN generates the WorldCat lookup |
| `evidenceNote` | O, L10n; source-specific method/evidence explanation |
| `language`, `languageCodes` | R string source-language description; O nonempty verified code list: `en`, `zh`, `es`, `multi`; absent codes use limited label parsing in search, not assumed translation availability |
| `region`, `sourceVersion` | O, L10n; source applicability and recorded edition/version, without inventing a revision date |
| `free` | R, boolean; free source access; false does not prevent a free eduStack introduction |
| `sex` | R; `all`, `male`, `female`; source applicability, used where growth/puberty requires it |

`classic` is an editorial reading position in the existing resource enum. It
does not imply that all works by that person are classic resources or that a
historical theory is supported as a whole by related modern research.

The current tag keys in `taxonomy.mjs` are `sleep`, `activity`, `screen-time`,
`social-media`, `mental-health`, `nutrition`, `development`, `language`,
`emotions`, `communication`, `discipline`, `learning`, `safety`, `puberty`,
`responsive-care`, `self-regulation`, `play` and `attachment`. Their bilingual
labels and definitions belong there; a new tag needs an editorial meaning.
Stage development areas are separate keys: `social`, `emotional`, `language`,
`thinking`, `movement`, `identity`, `body`.

## Activities And Tips

| Activity fields | Requirement, type and meaning |
| --- | --- |
| `id`, `publicationStatus` | R; shared conventions |
| `title`, `summary` | R, L10n; concrete activity and short purpose |
| `minMonths`, `maxMonths`, `topics` | R; editorial inclusive ages and distinct recognised topic tags |
| `duration` | R; `short`, `medium`, `flexible`; directory category, not a prescribed training dose |
| `setting` | R, nonempty distinct list from `home`, `travel`, `outdoors` |
| `time`, `materials`, `participants` | R, L10n; practical time flexibility, equipment and adult/child involvement |
| `steps` | R, L10nList; complete corresponding instructions in both languages |
| `adaptations`, `cautions` | R, L10n; alternatives, stopping choices, safety and use limits |
| `basis` | R, L10n; what informed the design and what has not been evaluated |
| `readings` | R, distinct resource ID list; further reading, not proof of the entire activity |
| `tools` | R, distinct tool ID list; optional aids; may be `[]`, and core steps remain usable without tools |
| `citations` | R, nonempty `{ src: string, note: L10n }[]`; distinct citations explaining the exact supporting scope |
| `authorship` | R; only `original` currently implemented; do not insert an unreviewed adaptation/translation enum |
| `created`, `updated`, `checked` | R, dates; first site publication, editorial revision and source check, with `created <= updated <= checked` |

Activity time/age choices are editorial starting points, not developmental
milestones. Background recommendations do not show that an original activity
has tested effects. Draft activities must not use an invented publication date;
set the real `created` date when publishing.

| Tip fields | Requirement, type and meaning |
| --- | --- |
| `id`, `publicationStatus`, `minMonths`, `maxMonths` | R; shared conventions |
| `resource` | R, published resource ID; the authoritative related reading |
| `text`, `why` | R, L10n; brief suggestion and appropriately bounded explanation |

Tips are lightweight suggestions, distinct from complete activity entries.
There is no tip publication/update date field or activity ID field today.

## Educators And Sources

| Educator fields | Requirement, type and meaning |
| --- | --- |
| `id`, `publicationStatus`, `name` | R; shared conventions and L10n name |
| `years` | R, string; displayed historical lifespan including approximation |
| `birthYear` | R, integer or `null`; negative BCE, positive CE, no zero; unknown stays last in chronological sorting |
| `region` | R, L10n; fuller associated place/context description |
| `origin` | R, region key in `educatorRegions`; one browsing association, not exhaustive nationality/activity |
| `directions` | R, nonempty distinct `educatorDirections` keys; overlapping editorial reading directions; first controls grouping |
| `role`, `question`, `basis` | R, L10n; role, family reading question and actual reading basis |
| `reviewed` | R, date; editorial review, not a claim to have checked every external source or read each full work |
| `works` | R, `{ title: L10n, note: L10n, src: string }[]`; selected title, edition/read-scope note and resolvable source; no independent work database |
| `bio`, `today` | R, Claim; introduction and current interpretation |
| `ideas`, `supported`, `outdated` | R, Claim lists; ideas, bounded continuing relevance and historical limitations; empty coverage is not proof of no limitations |
| `texts` | R, `{ label: L10n, url: HTTPS }[]`; original-text access pointers, not global public-domain claims |

`educator-browse.mjs` defines directions and regions. Directions such as `care`,
`development` and `experience` are reading categories, not exclusive historical
schools. Do not invent child age limits or publication years for educators.

| Source dictionary fields | Requirement, type and meaning |
| --- | --- |
| Mapping key | Stable source identity, e.g. `harvard-ef-guide`; no separate `id` property |
| `by` | R, string; responsible body/person |
| `label` | R, L10n; publicly readable source label |
| `url` | R, HTTPS; public source pointer |

Sources have no `publicationStatus`, check date, permission status or private
reading notes. The entire dictionary is public-suitable metadata, not a draft
store. Retain a source while any public claim still uses it.

## Tools

| Fields | Requirement, type and meaning |
| --- | --- |
| `id`, `publicationStatus` | R; shared conventions |
| `name`, `by` | R, strings; product and responsible provider |
| `url`, `privacy`, `backingUrl` | R, HTTPS; tool access, privacy information and the recorded supporting/context page |
| `minAge`, `maxAge` | R, inclusive integer years, `0 <= minAge <= maxAge <= 18`; preserve the displayed source labels |
| `subject` | R; `early`, `general`, `coding`, `science`, `reading` |
| `what`, `languages`, `backing` | R, L10n; purpose summary, language description and the exact nature of recorded backing |
| `topics` | O, tag list; absent means no explicit tags |
| `relatedResources` | O, resource ID list; further reading; does not imply the tool was evaluated by those studies |
| `languageCodes` | O, nonempty list from `en`, `zh`, `es`, `multi`; same verified-language convention as resources |
| `purpose`, `audience`, `limits`, `access`, `device`, `registration` | O, L10n; task, intended users, restrictions, cost/access, device and account requirements; missing details remain unrecorded |
| `checked` | O, date; genuine source check, never template creation |

The current index treats published external tools as free for core access;
optional fees still need accurate `access` text. This is adapter behaviour,
not a new `free` field on tools. Unknown account, device or regional conditions
must not be replaced by optimistic defaults.

## Topic Pages

| Fields | Requirement, type and meaning |
| --- | --- |
| `id`, `publicationStatus`, `name`, `teaser` | R; shared identity/state and L10n title/description |
| `status` | R; `ready` or `preparing`, independently of publication status |
| `updated` | R, date; editorial change, not original source publication |
| `bottomLine` | O, L10n; required for `ready`; bounded synthesis |
| `sources` | O, `{ name: L10n, note: L10n, resource?: string, url?: string, additionalResources?: string[] }[]`; comparison columns; requires a published resource or HTTPS URL; extra resource IDs may cover other ages/documents |
| `rows` | O, `{ age: L10n, cells: L10n[], verdict: 'agree' \| 'differ' \| 'single', verdictNote?: L10n }[]`; one cell per source column, same order; age may describe the comparison question rather than a numeric range |
| `picks` | R, resource ID list; non-research editorial reading selections |
| `research` | O, research resource ID list; research background |
| `tags` | O, distinct topic-tag list; explicit search tags; when absent search derives tags from picks/research; `[]` is explicitly no tags |
| `sections` | O, `{ id: string, title: L10n, text: L10n, citations: { src: string, note: L10n }[] }[]`; section IDs unique within the page, each with at least one scoped citation |
| `activities` | O, `{ activity: string, reason: L10n }[]`; distinct activity selections |
| `tools` | O, `{ tool: string, reason: L10n }[]`; distinct optional tool selections |

A ready topic needs substantive rows, sections, picks, activities or tools.
Preparation pages may publish checked pointers and an honest progress notice.
Topic pages have no numeric child age range or original publication year;
selected cards retain their own ages. A `tags` value is not a topic-page ID.

## Stage Guides And Stage Homepages

| Stage fields | Requirement, type and meaning |
| --- | --- |
| `id`, `publicationStatus`, `minMonths`, `maxMonths` | R; five ordered primary ranges from `taxonomy.mjs` |
| `name`, `range`, `focus`, `intro` | R, L10n; stage name, human-readable transition range, focus and introduction |
| `introSrc` | R, citation string; source for introduction |
| `develop` | R, `{ areas: { area: string, points: Claim[] }[], concern: Claim }`; `area` is a development-area key, not a topic tag |
| `activities` | R, Claim list; legacy short cited suggestions, distinct from independent activity ID selections |
| `health` | R, `{ links: string[], extra: string[] }`; non-research resource IDs and source-dictionary keys respectively |
| `facts` | R, `{ label: L10n, value: L10n, source: string }[]`; cited facts; source uses legacy citation semantics |
| `research`, `picks` | O, resource ID lists; research background and non-research selections; picks must overlap stage age |
| `roots` | R, `{ educator: string, en: string, zh: string }[]`; published educator IDs and bilingual relevance explanation |
| `reading` | R, book resource ID list; maximum two further-reading books |
| `learning` | O, boolean; existing learning-section display flag; absent is false |
| `updated` | R, date; editorial change to stage guide |

Stage `facts` remains in the interface; it is not a separate fact collection
and is not comprehensively validated by the current data script.

| Stage-home fields | Requirement, type and meaning |
| --- | --- |
| `id`, `publicationStatus` | R; ID must match a published stage; every published stage needs a published home |
| `headline`, `intro` | R, L10n; curated stage introduction |
| `startingPoints` | R, `StageSelection[]`; 1-3 guides/guidelines |
| `reflection` | R, one `StageSelection`; book/classic reading |
| `context` | R, `StageSelection[]`; 0-3 research/guidelines; background, not a news feed |
| `updates` | O, `(StageSelection & { selectedOn: date })[]`; 0-3 guides/guidelines/research; absent becomes `[]` |
| `tools` | R, `{ tool: string, reason: L10n }[]`; 0-3 published tools |
| `activities` | O, `{ activity: string, reason: L10n }[]`; distinct published activity selections |
| `topics` | O, `{ topic: string, reason: L10n }[]`; distinct published ready topic-page IDs, not taxonomy tags |

`StageSelection` is `{ resource: string, reason: L10n }`. Resources cannot repeat
across the four resource-selection sections of one home. Resources, activities
and tools must overlap the stage, but overlap does not guarantee suitability
for every child in it. The child homepage filters again by actual month age.

## Relationship Ownership And Reverse Lookup

The originating field is the only manually maintained authority. Reverse views
are derived; they are not additional places to store the same relationship.
All public targets must be published, except public citation dictionary entries.

| Origin and actual fields | Target and cardinality | Meaning and reverse use |
| --- | --- | --- |
| Resource `backedBy` | Research resources, many | Evidence/background; `supportedBy(id).resources` |
| Stage/topic `research` | Research resources, many | Explicit research context; `supportedBy(id).stages/topics` |
| Claims `src`, stage `introSrc`/fact `source`, educator `works[].src`, activity/section `citations[].src` | Resource or source dictionary, one per claim/citation | Direct source for bounded text; resolve with `cite`; educator backlinks included in `supportedBy`; activity citations in `activitiesForResource`; topic sections in `topicsForResource` |
| Stage `health.links`, `picks`, `reading`; stage-home resource selections | Resources, many; reflection one | Editorial reading selections; `stagesForResource` aggregates these, not every stage claim |
| Stage `health.extra` | Source dictionary keys, many | Additional public health pointers; forward citation links |
| Stage `roots[].educator` | Educators, many | Historical reading connection; `stagesFor(educatorId)` |
| Topic `picks`, `sources[].resource`, `sources[].additionalResources` | Resources, many; main column resource optional single | Editorial reading and authority comparison; `topicsForResource` |
| Topic `sources[].url`, resource `sourceLinks`, educator `texts` | External HTTPS pages, many | Public access pointers; no internal object identity or automatic reverse relationship |
| Tool `relatedResources` | Resources, many | Further reading, not tool evaluation; `toolsForResource` |
| Activity `readings`, `tools` | Resources/tools, many | Related reading and optional aid; `activitiesForResource`, `activitiesForTool` |
| Topic `activities`, `tools` | Activities/tools, many | Editorial composition and reason; `topicsForActivity` derives activity backlinks; tool selections currently forward only |
| Stage-home `activities`, `tools`, `topics` | Activities/tools/ready topics, many | Stage editorial selection with reason; consumed by stage/home views; no persisted reverse list |
| Tip `resource` | Resource, one | Source reading for suggestion; forward lookup |
| Resource/tool/activity `topics`; topic `tags` | Taxonomy keys, many | Search classification, not page-to-page relationships |

`researchFor(ids, extra)` combines explicit research IDs with resources'
`backedBy` without duplicates. Reverse helpers are intentionally small and
selective: they are not an exhaustive impact graph. For a source update, also
search all source-owning fields rather than assuming one helper covers them.

## Identity, Age And Date Semantics

Keep existing IDs stable. Typed fields already declare their target collection,
so the same string can identify a resource and a tool without ambiguity.
Search keys add the type (`activity:small-project-plan`). Section IDs are scoped
to their topic page; stage-home ID equality with stage is intentional.

Legacy `src` and equivalent claim-source strings may name a resource ID or a
source key. A referenced collision between a published resource and source
dictionary key is a validation error. The runtime resolver currently looks for
a resource first; this order must not be used to justify ambiguous data.
Choose a uniquely identifying key and update references. A future newly added
field accepting multiple object types should use `{ kind, id }` and validate
the allowed targets. No generic mixed-reference field/resolver or relationship
engine is currently implemented; do not put such objects into existing strings.

Months are inclusive: `48..71` means the fourth birthday up to the sixth.
The five primary stages are `0..11`, `12..35`, `36..71`, `72..143`, `144..215`;
216 months is outside coverage. Activity cards, details and search labels show the
included birthday range (48..71 is ages 4-5), or exact months for partial years. Tool years are inclusive labels: `5..7` converts
to `60..95` months; shared search caps the upper end at 215. Unknown ages for
educators/topics stay unknown (`null` in the search index), never `0..215`.

| Date field | Nature and correct use |
| --- | --- |
| Resource `year`, `yearNote`, `sourceVersion` | Original source publication and separately explained edition/revision; old work added today remains old |
| Activity `created` | Actual first publication of original eduStack content |
| Stage/topic/activity `updated` | Editorial revision; not source publication |
| Resource/activity/tool `checked` | Actual source/link/details check; missing tool date remains unknown |
| Educator `reviewed` | Editorial review with the stated reading scope |
| Stage-home update `selectedOn` | Editorial selection date; does not prove the selected material is new |

Generated `SearchEntry.dateKind` is `source-publication` for resources and
`site-publication` for activities. Its `year` is resource year or activity
created-year respectively. Other entry types currently have null year and no
dateKind. Newest sorting uses the year, not precise day-level dates. Check,
review, topic-update and index-generation dates must not become publication
dates. There is no universal source revision date or site-created field for
older collections; preserve unknown information rather than backfilling it.

## Publication And Local Research Boundary

| State | Meaning | Public build |
| --- | --- | --- |
| `draft` | Work in progress; ID and state may be the only fields | Excluded |
| `in-review` | Awaiting source/text/translation/rights review | Excluded |
| `published` | Reviewed and approved for public presentation | Included |
| `needs-review` | Withdrawn pending a material recheck | Excluded |

The validator checks identity and publication enums for all entries; most
content-field checks operate on published entries. Only explicit `published`
items leave the loader. This is build filtering, not access control over a
public repository/history. Topic `status` is separate completeness metadata.
Local reading scope, acquired/failed-download state, permission judgement and
next-review dates belong in research records; none is a publication enum.

Public fields contain original bilingual introductions, necessary bibliographic
identity, sources, limitations, dates, access notes and relationships. Keep
originals, private paths, file hashes, internal rights assessments, research
logs and child profiles outside website content and public search. Preserve
`public/reference/`. Do not analyse restricted AAP full text or use abandoned
AI papers P02, P04 and P05. Downloading is not permission to reproduce; works,
translations, editorial material and images may have different rights.

Use the existing local research log, source-library catalog and copyright
record rather than copying them into this repository. One local crosswalk row
per use can follow this format (a local record convention, not public YAML):

```text
siteKind | siteId | fieldOrClaim | sourceKeyOrResourceId | libraryItemIdOrOfficialURL | editionOrVersion | actualReadScope | permittedUseAndLimits | researchRecord | checkedOn | unresolvedGap
```

`fieldOrClaim` identifies e.g. `works[0]` or `sections.small-start`; identify the
exact work/edition and what was actually read. Reuse existing catalog IDs.
Where no original file exists, an official URL plus verified reading record is
valid; do not fabricate paths or label an abstract as full-text reading. Any
private file path/hash stays only in the local record. Local-only mappings are
not automatically validated or embedded in the search index by this feature.

Complete these mappings for new/changed content. As acceptance samples, trace
one existing resource, one educator's selected work and one tool to their
actual local records, recording partial/unknown evidence honestly. This
dictionary defines the format; it does not claim that all historical mappings
or those acceptance samples have been completed. Record gaps in the local
batch/research record and fill them when their content is next used.

## Editing And Maintenance

1. Inspect current worktree and assign one writer per file. Find the existing
   source, reading-scope and rights records before changing source-dependent
   content. Resolve missing evidence only for work that depends on it.
2. Add with a stable ID and `draft`/`in-review`; write both languages, precise
   source scope, access/limits and required metadata. Update the local crosswalk
   for each new or changed claim. Publish only after editorial review.
3. Maintain relationships at the originating fields in the table. Use `rg -n`
   with the exact ID/key across `src/data`, views and routes to inspect usage;
   use the named reverse helpers to inspect affected reading cards. Search
   matches may also be tags or unrelated IDs, so check the target type.
4. For merges/renames, record the old/new mapping locally, update all references
   and retain a clear static migration entry for previously published URLs.
   There is no automatic alias table or redirect generator today. For material
   changes retain the ID; prefer optional additive fields. Before breaking a
   field contract, retain a recoverable copy and inventory consumers/URLs.
5. For withdrawal, use `needs-review` and repair public dependants, stage/home
   selections and source pointers in the same change. Do not delete a source
   still cited elsewhere. Treat an inaccessible URL separately from a retracted
   source: the latter may require revising conclusions and affected activities.
6. Run `npm run check:data`, then the shared final `npm run check` and
   `npm run build` sequentially. Check affected built routes/anchors, bilingual
   pages, mobile/keyboard behaviour and filtering; verify unpublished content
   is absent from routes and public search. Run `npm run test:built` against
   the final build when relevant to its coverage. A successful link response
   is not content/version review. `npm run check:links` is a separate full
   external-link maintenance check, not a substitute for built-route checks.

Keep research/maintenance cadence and results in existing local records.
Report implemented, verified and published separately; changing YAML or
passing a build does not itself publish the website.

## Explicit General Browsing

The activity directory parses `age=any` directly. The library's profile adapter
also preserves `age=any` as an explicit general-browsing preference across reload
and language links, while the search engine itself receives no age restriction.
An automatically selected child's month age is temporary and is not serialized.
