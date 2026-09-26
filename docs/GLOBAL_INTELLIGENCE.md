# Global engineering intelligence

Spec §21–§24 and §138: companies, products, specifications, applications, research, patents and
market information from permitted public sources — with source, retrieval date, evidence and
verification on every fact.

## What exists today

| Layer | Content | Data type / status |
|---|---|---|
| Companies & suppliers | 60 companies named in handbook tables (suppliers, makers, integrators), each with evidence pointing to the handbook section; 10 supplier records (real vendor names) from the legacy cost platform | PUBLIC · SOURCE_DOCUMENTED (handbook) / DEMO (legacy vendors). Country, products and India presence stay UNKNOWN until curated |
| Technology | 16 technologies from the handbooks | TEAL_INTERNAL; radar position unset until assessed |
| Standards | 15 standards referenced by the TEAL material | PUBLIC |
| Laser / optics | 12 source **classes** and 5 f-theta objectives used by the configurator — representative parameters, not datasheets | TEAL_INTERNAL |
| Manufacturer products, datasheet specs | **none** | require ingestion |
| Research, patents, market numbers | **none** | require ingestion; the OS never generates them |

The *Global intelligence* page shows these counts, the pipeline, the company database and — for
research, patents and market — an explicit empty state explaining how data would arrive.

## How data gets in

Only via the reviewed ingestion pipeline ([INGESTION.md](INGESTION.md)): manifest review →
fetch (robots.txt, rate limits, no auth/paywall/CAPTCHA bypass) → parse → normalize → dedupe
(conflicts flagged, never overwritten) → evidence → validation → review → pull request →
merge. The GitHub Pages frontend does no scraping and makes no calls to third-party sites.

## Demo (spec §138)

*Global intelligence → Search* runs "50W 1064nm nanosecond laser marking source" through the
engineering search: source classes (e.g. fiber / MOPA), platforms and applications that use
them, handbook sections on nanosecond marking, and handbook-named companies with evidence. From
any result: *Similar* (record page), *What can we reuse?*, *What is missing?*.

**Honest gap:** until a manufacturer catalogue is ingested, the search cannot return verified
third-party products or specifications. It does not pretend to.

## Candidate first sources (for review — none enabled)

Manufacturer-provided product tables (laser sources, scan heads, objectives) under a written
permission or data-sharing arrangement; open government and standards datasets with a clear
licence; licensed APIs the company subscribes to. Each needs a manifest with the permission
review filled in before `enabled: true`.
