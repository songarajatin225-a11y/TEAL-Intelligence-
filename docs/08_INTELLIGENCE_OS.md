# 08 — TEAL Intelligence OS: final master prompt, audit and implementation

Source: *TEAL Intelligence OS — Final Master Prompt* (65 sections). This document records how each
section maps onto the platform, what was reused (§63: *do not destroy existing work*) and what is
deliberately left open.

## 1. Product definition (§01, §65)

> TEAL Intelligence is TEAL's digital Product Development and Technology Intelligence platform —
> connecting market opportunities, technology, applications, product architecture, suppliers, cost,
> localization and execution in one system.

The definition is on Mission Control and in Settings → About. The business flow (§03, §55) is a
clickable strip on Mission Control: Market → Customer → Opportunity → Technology → Application →
Product → Architecture → Supplier → BOM → Cost → Localization → POC → Project → Validation →
Commercial, each step with its record count.

## 2. Audit (§62 phase 1) — what already existed and was reused

| Existing capability | Reused for |
|---|---|
| Configurator engine (legacy simulator, golden-tested) | Application engine (§14/§23), technical specification document, architecture tree |
| Architecture builder (`deriveArchitecture`) — now `features/machines/architecture.ts` | Subsystem architecture in the engine, product architecture tree (§15/§59) |
| BOM generator (`bomGen`) | Indicative BOM, cost drivers, localization in the engine |
| Cost engine (legacy cost platform, golden-tested), scenarios | §20 cost engine — unchanged; new gross-margin and local-content calculators |
| Gates G0–G10, FAT/SAT, requirements, traceability | §16 lifecycle evidence, validation-plan document |
| Gap engine, graph, similarity, health | Lifecycle, seven questions, PRD open questions, rooms |
| Search (MiniSearch partitions) | §26 parametric search sits on top of it |
| Handbooks (Automation Part 32, 57) | DFM checklist document (quoted and cited) |
| PM tracker concepts (activities, follow-ups, meetings) | Execution views (§24) |

## 3. Section map

| § | Requirement | Where |
|---|---|---|
| 04–13 | Domain architecture (Laser, Electronics/EMS, Semiconductor, Battery, Automation, Advanced Manufacturing); new domains without redesign | `domain` records in `data/domains/domains.json`; one generic hub `/domains/:id`; `/domains` |
| 06, 07, 12 | Equipment databases | `equipment` entity, per-domain table on each hub, `/equipment` (none seeded) |
| 14, 23 | Application engine / universal configurator | `/solution` · `services/solution.ts` |
| 15, 59 | Product → system → subsystem → module → component (→ spec → supplier → cost) | `/product-architecture` · `services/architecture.ts` |
| 16 | 17-stage lifecycle with owner, timeline, budget, customer, supplier, technology/TRL, risks, dependencies, milestones, deliverables | `/development` · `services/lifecycle.ts` · lifecycle card in rooms |
| 17 | Technology record + radar with a transparent methodology | TRL fields on `technology`; maturity lanes from TRL only (`services/maturity.ts`); rings need a rationale |
| 18 | Supplier database, comparison, trust | Suppliers, Supplier Risk, Compare, supplier-comparison document, trust labels |
| 19–21 | BOM, cost, localization | Existing engines; local-content calculator; localization in the engine |
| 22 | Customer requirement engine | `/capture` · `services/requirementCapture.ts` |
| 24 | Execution: kanban, table, timeline, calendar, milestones, risk matrix | `/execution` |
| 25 | Knowledge base records | `article` entity, `/articles`; handbooks unchanged |
| 26 | Parametric search ("20–50 W UV lasers for semiconductor marking") | `services/parametric.ts`; panel on Search and Ask |
| 27 | Cross-domain intelligence | `/cross-domain` · `services/crossDomain.ts` |
| 28 | Opportunity matrix, no automatic scores | `/opportunity-matrix`; 12 optional opportunity fields |
| 29 | Roadmap 2026 → 2030+ | `roadmap_item` entity; Roadmap → *2026 → 2030+* tab |
| 30, 58 | Command Center / Executive view with drill-down | Mission Control + Executive board (nine panels) |
| 31 | WHAT · WHY · HOW · WHO · HOW MUCH · WHEN · WHAT NEXT | *Seven questions* card in opportunity / project / product rooms |
| 33 | Application shell IA | `app/nav.ts`: Command Center · Intelligence · Domains · Product · Ecosystem · Execution · Roadmap · Data · Settings (with sub-groups) |
| 34 | Command palette commands | Create…, Open cost engine, Open configurator, Compare technologies, Open knowledge, Import / Export data, Generate a document |
| 35 | DatabaseService; UI never touches IndexedDB | `services/database.ts`; no `.tsx` calls `workspaceDb()` |
| 38 | DataRepository · AuthProvider · SearchProvider · SyncProvider | `services/providers.ts` (static / local implementations, honest descriptions) |
| 39 | Data health: records, valid, warnings, errors, duplicates, missing sources, last updated | `/data-quality` (Data Health) |
| 40 | VERIFIED · REFERENCE · ESTIMATED · USER ADDED · TO BE VALIDATED · DEMO DATA | `services/trust.ts`, `TrustBadge` on lists, cards, records, drawers, documents |
| 41, 56 | Demonstration data and five use cases | DEMO opportunities (scenarios 4–6), `/use-cases` — gaps shown as gaps |
| 42 | Eleven document templates | `/documents` · `services/documents.ts` (Markdown, UNKNOWN where unrecorded) |
| 43, 57 | Analytics; business value | Dashboards; `/value` (records, reuse, coverage, development visibility) |
| 44 | Calculators with inputs → formula → result → assumptions | + average power, line speed for overlap, gross margin, local content, project progress, schedule variance |
| 47 | ONLINE · OFFLINE · LOCAL DATA · SYNC PENDING | System status + drafts indicator (sync provider tracks the last change-package export) |
| 48–50 | Responsive, accessible, performant | Unchanged commitments; axe checks now cover 14 pages |
| 51 | Security limitations stated | Settings → Security |
| 53 | validate · build · deploy · data-index workflows | `data-index.yml` (renamed from search-index); deploy runs only after validate + test |
| 54 | README with Mermaid architecture | README |

## 4. Honesty rules applied

* **Nothing invented.** Domain taxonomies are names from TEAL's own master prompt (source record
  `src-os-master-prompt`). No TRL, radar ring, market size, supplier capability, equipment record or
  knowledge article is seeded. The engine proposes a machine only when a TEAL application record
  exists; otherwise it says a POC is needed.
* **Explainable.** Health, lifecycle, maturity, complexity, parametric filters and cross-domain
  cells each show the rule or the evidence behind them.
* **Demo is labelled.** New demo opportunities use the existing fictional customers and carry
  DEMO DATA.

## 5. Open by design

* **Advanced Manufacturing** has no taxonomy — the master prompt names it only. Add sections to its
  record when TEAL defines them.
* **Equipment, knowledge articles, roadmap items** start empty; they are TEAL's to fill from sources.
* **Mechanical depaneling / dicing** have no TEAL data — the use cases show these as gaps.
