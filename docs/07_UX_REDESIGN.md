# 07 — UX Redesign: audit, information architecture, design system

Scope: presentation and interaction only. Routes, data model, repositories, IndexedDB workspace,
calculations, search index and tests are preserved (every pre-redesign route still resolves).

## 1. Audit of the V1 interface

| # | Finding | Evidence | Consequence |
|---|---|---|---|
| 1 | **Navigation overload** | 26 top-level sidebar entries + 30 children, all uppercase, one flat list | users scan 56 labels to find one page; no mental model |
| 2 | **Question wall on the home page** | 8 equal KPI tiles + 10 equal numbered question cards | nothing is visibly more important than anything else |
| 3 | **Tiny type** | body 13 px, labels 10.5–12 px, `text-[11px]` in ~400 places; IBM Plex referenced but never loaded | fatiguing to read, especially dense engineering tables |
| 4 | **Weak hierarchy** | card titles are 12 px uppercase grey; page titles 20 px | headings don't lead the eye |
| 5 | **No global context** | no breadcrumb; record pages show an entity label only | users lose their place inside deep records |
| 6 | **Advanced detail exposed first** | record pages show provenance, raw fields, JSON blobs, gaps, similar and reuse panels at once | first screen of every record is a wall |
| 7 | **Inspection requires navigation** | every table row navigates to a full page | slow triage of lists |
| 8 | **Inconsistent titles/terms** | "Proof of concept", "Engineering decision records", "Change management (ECR / ECN)", "Item master", "RFQ engine", "Quality / Risk / FMEA" | mixed register; some are implementation-flavoured |
| 9 | **System state hidden** | offline and draft state are small badges; no attention centre, no toasts | writes to the local workspace give no feedback |
| 10 | **No personalisation** | no theme control, no density, no favourites, no recents, no workspace emphasis | experts and newcomers get the same dense screen |
| 11 | **Mobile is a shrunk desktop** | sidebar overlay only; tables scroll horizontally | unusable at 390 px for anything but reading |
| 12 | **Command palette is a flat list** | 40+ commands, no groups, no context actions | hard to discover |

Redundancies found (kept as routes, merged in navigation): *Dashboards* vs *Command Center*;
*Companies* vs *Customers* vs *Suppliers* (three views of organisations); *Memory* vs *Reuse*
vs *Missing* (three digital-thread questions, now grouped under Knowledge → Thread intelligence).

## 2. Information architecture

Domain → object → context → action. Ten domains in the sidebar, each collapsible:

| Domain | Pages (route) |
|---|---|
| **Home** | Mission Control `/` · Dashboards `/dashboards` |
| **Work** | My Workspace `/pm` · Activities · Opportunities · Customers · Projects · POCs · New from inquiry `/inquiry` |
| **Engineering** | Products · Configurator · Platformization · Applications · Materials · Requirements · Traceability · Process · DOE · Machines · Architecture · Modules |
| **Laser** | Laser Platform `/laser` (new hub with beam path) · Laser Sources `/laser-sources` · Optics · Galvo Scanners · Process Engineering · Calculators · Formulas |
| **Supply chain** | Suppliers · Procurement · BOMs · Components `/items` · RFQs · Cost |
| **Semiconductor** | Semiconductor Intelligence · Equipment Buyer |
| **Knowledge** | Engineering Knowledge · Search · Evidence · Lessons Learned · Graph · Memory · Reuse · What's Missing · What Changed · AI Context |
| **Quality & release** | Risk & FMEA · Design Gates · Decisions · Change Requests · FAT / SAT · Production Release · Field Service |
| **Strategy** | Global Intelligence · Technology Radar · Localization · Roadmap · Companies |
| **Admin** | Data & Workspace · Data Quality · Reports · Help · Legacy Applications |

**Workspaces** (a presentation layer — same data): Engineering (default), Product Management,
Laser, Semiconductor, Supply Chain, Intelligence, Executive. A workspace reorders and expands the
relevant domains, sets the home emphasis and — for Executive — simplifies Mission Control to
opportunities, projects, portfolio, technology, risks, cost and roadmap.

## 3. Design system — "Engineering Liquid Glass"

* **Tokens** (`src/index.css`): colour (teal identity, navy ink, semantic success · warning ·
  critical · info · draft · demo · unknown · estimate · verified), glass (`--glass-bg`,
  `--glass-bg-strong`, `--glass-border`, `--glass-highlight`, `--glass-shadow`, `--glass-blur`),
  radius (controls 12, cards 18, panels 22, pills), elevation, motion (120/180/240 ms, standard
  easing), z-index, density.
* **Glass is for hierarchy**: blur only on the shell (sidebar, top bar), overlays (drawers,
  modals, popovers, toasts, command palette). Content cards are translucent tinted surfaces with a
  highlight edge but **no blur** (cheap to render, always legible). Opacity rises automatically
  with `prefers-reduced-transparency`, with *reduced effects* and in high-contrast needs.
* **Type**: Inter Variable (UI) + IBM Plex Mono (numbers, ids), self-hosted — works offline.
  Body 14 px, secondary 13 px, metadata 12 px, page title 28–32 px, section 18 px, metrics 30 px.
  All sizes are rem-based, so **density** (Comfortable 16 px root · Compact 15 px · Focus 17 px)
  scales the whole interface consistently.
* **Motion**: hover 120 ms, panels 180–240 ms, route fade + 4 px rise; all disabled under
  `prefers-reduced-motion`.
* **Signature motifs**: Engineering Signal (system-state dot), Glass Edge (teal top highlight),
  Traceability Line (connector for engineering chains), Laser Beam Accent (laser contexts only).

## 4. Interaction patterns

| Pattern | Use |
|---|---|
| Right drawer (≈ 480 px) | inspect a row without leaving a list; WHY?; quick create; forms |
| Modal | confirmations, onboarding, shortcuts |
| Full page | records needing deep work (tabs: Overview · Related · Intelligence · Evidence · History · System) |
| Popovers | system status, drafts, attention centre, quick create, workspace switcher |
| Toasts | every local write, export and error |
| Command palette ⌘K / Ctrl K | navigation, creation, actions, context actions, records, recents |
| Shortcuts | `/` search · `g h/w/p/l/k/c/s` go · `n` create · `f` focus · `?` shortcuts · Esc close |

## 5. Accessibility commitments (WCAG 2.2 AA)

Semantic landmarks and headings (one `h1` per page), skip link, visible focus rings, focus
trapped and restored in dialogs/drawers, Esc closes, live regions for toasts and loading, labels
on every control, 40 px minimum touch targets on touch devices, colour never the only signal
(status pills carry text + icon), contrast ≥ 4.5:1 on glass (opacity, not blur, provides contrast).

## 6. Brand

The TEAL logo is used **only as the original file** supplied by TEAL, placed at
`public/brand/teal-logo.png` (sidebar, mobile header, welcome dialog). It is never redrawn or
recoloured. Until the file is committed, a plain "TEAL" text label is shown.

## 7. Where it lives in code

| Concern | Files |
|---|---|
| Tokens, glass, motion, density | `src/index.css` |
| Primitives (buttons, cards, drawer, modal, popover, tooltip, tabs, segmented control, chain, skeleton) | `src/components/ui.tsx` |
| Status + data-trust language | `src/components/badges.tsx` |
| Toasts | `src/components/toast.tsx` |
| Preferences (theme, density, effects, sidebar, workspace, pins) | `src/app/prefs.ts` |
| Information architecture, workspaces | `src/app/nav.ts` |
| Shell: sidebar, breadcrumbs, global search, status/drafts/attention, quick create, help, onboarding, shortcuts | `src/app/Layout.tsx`, `src/app/shell/*`, `src/app/CommandPalette.tsx`, `src/app/help.ts` |
| Attention logic (pure, tested) | `src/services/attention.ts` |
| Inspection drawer, enterprise table | `src/components/EntityDrawer.tsx`, `src/components/DataTable.tsx` |
| Signature views | Mission Control, Laser Platform (beam path), Traceability chain, Product stage pipeline |

## 8. Verification

`tests/e2e/shell.spec.ts` covers sidebar collapse/persistence, breadcrumbs, command palette
(incl. context actions), grouped global search, `g`/`/`/`n`/`f` shortcuts, quick create with toast,
row → drawer inspection, record tabs, pinning, theme + density persistence, workspaces, focus
mode, contextual help, first-visit onboarding, mobile bottom bar + no horizontal overflow at
390 px, and **axe-core WCAG 2.x A/AA checks (no serious or critical violations) in light and dark**
on six key pages. `tests/e2e/smoke.spec.ts` asserts every route renders exactly one `h1`.
