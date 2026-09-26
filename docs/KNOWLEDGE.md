# Knowledge

## 1. The three handbooks

| Handbook | Parts | Role in the OS |
|---|---|---|
| The Complete Semiconductor Industry Handbook | 22 | industry & value chain, equipment buyer view, cost of ownership, localization |
| The Complete Laser Handbook | 31 | laser physics, sources, optics, processes, applications, safety |
| Automation Equipment Building Handbook | 87 | engineering method: requirements, architecture, design, gates G0–G10, FAT/SAT, formulas (Part 54) |

Conversion: `scripts/knowledge/docx_to_markdown.py` (python-docx) → `knowledge/handbooks/<book>/NN-<slug>.md`
with YAML front matter (handbook, part, source document, `data_type: TEAL_INTERNAL`,
`verification_status: SOURCE_DOCUMENTED`, transcription note) and `_index.json` per book.
Tables become Markdown tables; equations are linearised text; **figures are not transcribed**
(marked `[Figure not transcribed]`). The `.docx` originals are not committed.

The reader (*Knowledge*) renders parts with section anchors; every citation in the OS
(`/knowledge/<book>/<file>?a=<anchor>`) opens the exact section. Search indexes each section
separately (1 079 sections).

## 2. Structured data extracted from the handbooks

`scripts/knowledge/extractHandbookData.ts` parses handbook tables — it does not paraphrase:

| Output | From | Records |
|---|---|---|
| `data/gates/gate-definitions.json` | Automation Handbook gate table + rules | 11 |
| `data/knowledge/formulas.json` | Automation Handbook Part 54 formula catalogue | 177 (41 implemented as calculators; `implemented_by` points to the function) |
| `data/semiconductor/value-chain.json` | Semiconductor Handbook value chain + laser relevance (Part XXXII) | 21 |
| `data/companies/handbook-companies.json` | companies named in handbook tables | 60 |
| `data/evidence/handbook-evidence.json` | one evidence record per extracted claim, with section and excerpt | 136 |
| `data/technology/technologies.json` | technologies discussed in the handbooks | 16 (radar position unset) |
| `data/config/acceptance-checklists.json` | FAT §38.8, FAT readiness §57.12, SAT readiness §57.13, production release §57.14 | 4 checklists |

Two formula rows (T1, T3) were split across cells in the source; they were repaired and the
repair is noted in their provenance.

## 3. Knowledge features

| Feature | How it works |
|---|---|
| **Search** | MiniSearch indexes built at deploy time per partition (products, companies, suppliers, laser, modules, applications, knowledge, research, patents, records) + local drafts indexed in the browser. Syntax: `entity:product`, `book:laser`, `"exact phrase"`. Facets by entity, data type, partition. |
| **Knowledge graph** | edges from reference fields and `links[]`; neighbourhood explorer; build-time `graph.json` |
| **WHY?** | for any record: provenance, source, evidence, assumptions, rules, UNKNOWN fields; for any calculated value: formula, inputs with units, citation, assumptions, warnings |
| **What is missing?** | per opportunity/project/product: requirements, acceptance criteria, signed URS, POC, DOE results, process window, configuration, BOM, cost, suppliers, validation, documents — each with an action |
| **What can we reuse?** | deterministic similarity (shared terms + shared features) with visible reasons; classes Reusable · Similar · Potentially reusable · Requires validation · Not compatible; DEMO/INFERRED never count as validated reuse |
| **What changed?** | dataset versions and hashes from the catalog, stale/conflicted/discontinued records, this browser's change log |
| **Engineering memory** | lessons, decisions, POC decisions and handbook knowledge around a topic |
| **Evidence ledger** | claim · entity · source · document · section · excerpt · verification · confidence |
| **AI context generator** | assembles a record's thread into a structured text + 13 prompt templates to paste into an assistant of your choice; no API calls, no keys |

## 4. Adding knowledge

Knowledge changes are Git changes: add Markdown under `knowledge/`, or records to `/data`
(lessons, decisions, evidence) through the app's change packages. CI rebuilds the search index
and graph (`data-index.yml`).
