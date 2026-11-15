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
| `/`, `/zh/` | Public editorial selections, age entries, search and tools access; no assumed child age or personalised claims | Refine selections as reviewed content grows |
| `/ages/` | Five primary age groups, usable without a profile | Keep the simple age navigation |
| `/ages/{id}/` | Existing development, activities, resources and health pages | Design dedicated stage homepages in phase three |
| `/tools/` | Available external tools and clearly labelled development candidates | Common tool detail template and individual browser tools |
| `/educators/` | Thinkers, ideas, original works and historical limitations | Add reviewed readings incrementally |
| `/topics/` | Existing topic explanations or clearly labelled pages under preparation | Add topics and suitable templates incrementally |
| `/library/` | Browse and search published books, readings, practical resources and guidelines | Expand browsing to all resource categories in phase two |
| `/resources/{id}/` | Source, editorial summary, age scope and access information; research is linked in context | Improve type-specific metadata and templates |
| `/me/` | Local child profiles and existing age-based suggestions | Connect profiles to stage homepages in phase four |
| `/reference/` | Fixed original static design, including its page directory | Keep the snapshot unchanged |

The main menu order is Home, By age, Tools, Educators, Topics, Library, My child.
The homepage alone adds Search at the right edge. Reserve the same search
column on interior pages so the other links do not move between pages.
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
| `purpose`, `audience`, `limits`, `access`, `checkedNote` | What it solves, who can use it, limits, availability and what was checked; required for practical guides and classic readings, extended to other types in phase two |
| `language`, `free` | Source languages and free-reading status; do not imply that every linked book or paper is free |
| `checked` | Date source link and recorded details were actually checked |
| Stage/topic `updated` | Date editorial content changed; separate from source checks |
| `evidence`, `design`, `evidenceNote` | Existing evidence metadata; labels are not a universal reliability ranking |
| `sourceLinks`, `src` | Additional source URLs and claim-level source keys |
| `backedBy`, `research` | Research IDs supporting or contextualising a resource, stage or topic |
| `picks`, `reading`, `roots` | Editorial selections, further-reading books and educator connections |

Tools currently use their own data collection and age matching. A unified
resource browser, tool-topic relations, region fields, source revision dates
and detailed reuse metadata require phase-two design. Do not publish invented
values to fill those future fields.

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

Astro builds static HTML and GitHub Pages serves `dist/`. Search and filters run
in the browser. Profiles stay in localStorage on the current browser; the
existing profile code can transfer them manually. Clearing storage may erase
them. The ordinary homepage does not yet read profiles or become personalised.
Do not promise cloud accounts, automatic device sync, online AI or server tasks.

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
3. Inspect English and Chinese homepages and representative interior pages at
   desktop, mobile and 320px widths; test text resizing and spacing.
4. Check menu positions, keyboard navigation, search, age and tool entries,
   language switching, source dates and any changed links.
5. Confirm the reference snapshot did not change. Publish only website files.

Phase-one completion establishes the framework and rules. It does not require
every topic, tool or resource to be written. Dedicated stage homepages,
profile-driven homepages and new tools retain their later-phase scope.
