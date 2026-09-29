# RAG Architecture

## Pipeline (as implemented)

```text
Question
  │
  ├─ Intent engine (what is asked) ──► Router (which engines)
  │
  ▼
Query expansion  — curated engineering synonyms / spellings (fiber↔fibre, galvo↔scan head, 1064 nm↔IR …),
                   shown to the user as "also searched"; never changes meaning
  │
  ▼
Hybrid retrieval ───────────────────────────────────────────────────────────────┐
  • BM25 keyword  — the platform's build-time MiniSearch indexes (11 partitions,│
                    incl. 1 519 handbook sections), fuzzy + prefix               │
  • Lexical vectors — hashed TF-IDF word + character-trigram vectors over all   │  Reciprocal
                    records (built in the browser); NOT a neural embedding       │  Rank Fusion
  • Graph expansion — neighbours of the strongest record hits                   │  (k = 60)
  • Metadata filters — entity types, data types, exclude DEMO, handbooks on/off  │
  ◄──────────────────────────────────────────────────────────────────────────────┘
  │
  ▼
Technical reranker — spec constraints met / failed, exact identifiers, entity prior per intent,
                     verification trust, DEMO penalty, graph proximity to the page context,
                     lookup-table penalty; every contribution recorded as a reason
  │
  ▼
Context builder — handbook sections of the top knowledge hits are fetched (cached), split into
                  2–3 sentence windows, scored (query terms, section heading, retrieval rank);
                  the best window is quoted verbatim with its section link
  │
  ▼
Structured engines run first for technical intents (part search, compatibility, configurator,
supply, capacity …) — RAG adds explanation and evidence, it does not replace structured data
  │
  ▼
Composer (local) — claims with class + sources   │   (FUTURE: reasoning LLM receives the same
                                                  │    verified bundle through the AI gateway)
  ▼
Engineering validator → Confidence engine → Answer
```

## Why hybrid, and why lexical vectors are labelled

Keyword search misses paraphrase and spelling; vector search misses exact identifiers and numbers.
Fusing them with RRF is robust without score calibration. The vector leg in V1 is lexical
(shared words and word fragments), which gives spelling tolerance and partial-term matching —
but not meaning. It is labelled "Lexical vector index (not neural)" in the registry, the Control
Center and this document. A neural embedding model (`gw-embedding`) plugs into the same
interface when a gateway exists; the lexical index stays as the fallback.

## Embedding store (§13)

Each vector entry keeps `id`, `vec`, and metadata `{ entity, data_type, source }`; the index keeps
`kind`, `dims` (8 192), `builtAt`. Records only: handbook text is not stored in the vector index —
handbook sections are retrieved by BM25 and passage-scored on demand, which keeps the bundle small.

## Document ingestion (RAG over new documents)

| Source | V1 | FUTURE |
|---|---|---|
| Handbooks (Markdown) | Indexed at build time; passages fetched on demand | — |
| Records (JSON datasets) | Indexed at build time + lexical vectors in the browser | server vector store |
| Pasted RFQ / inquiry text | Requirement extractor (`agents.ts`) | — |
| PDF / DOCX / XLSX, datasheets, quotations, test reports | Not in the public site | Gateway `/v1/extract` with page/section provenance; values stored `INFERRED` + `DRAFT` until verified |

Confidential documents (quotations, customer drawings, NDA material) never enter the public
repository or site; they belong in a private deployment's document store.

## Citations

Every claim carries `SourceRef[]`: record (id, field, verification, data type, excerpt), handbook
(`book/file.md#anchor`, heading, quoted passage), engine / rule (id, locator). The validator
removes any asserted claim whose sources do not resolve. Passages are quoted, not paraphrased.

## Grounding rules

* Structured data first; RAG explains.
* "Data not available in the TEAL Intelligence knowledge base." when nothing supports an answer.
* Conflicting specifications are shown as **SPECIFICATION CONFLICT** with each source.
* DEMO records are never presented as verified (claim class ASSUMED, DEMO badge on the source).
