# Ingestion

External engineering data (manufacturer products, specifications, public company information,
open datasets) enters the OS **only** through a reviewed pipeline that runs in a GitHub Action or
on a contributor's machine — never in the browser (spec §21–§22, §100–§101). Quick start:
[ingestion/README.md](../ingestion/README.md).

```
ingestion/sources/<id>.json  (reviewed manifest, enabled: true)
        │  discoverSources
        ▼
fetchSource ── file: ingestion/inbox/ only
            └─ https: robots.txt (RFC 9309) → rate limit → one request, no silent redirects
        │  raw snapshot + .meta.json (url, time, sha256) → ingestion/raw/   (git-ignored)
        ▼
parseProduct      rows → typed fields via the manifest mapping; original cell text kept
normalizeCompany  one company key per legal-form/case variant  (co-<key>)
normalizeProduct  candidate record of the target entity with provenance + data type
deduplicate       vs. batch and master: new · changed (CONFLICTED + field diff) · unchanged
generateEvidence  one evidence record per value (claim, document, row, excerpt, date)
validateDataset   schema validation → ingestion/candidates/<id>/{<entity>.json, evidence.json,
                  source.json, REVIEW.md}            (git-ignored; uploaded as a CI artifact)
        │
        ▼
human review of REVIEW.md → move accepted records into /data → PR → CI → approval → merge → deploy
```

## Source manifest

Validated by `SourceManifest` (`scripts/ingestion/manifest.ts`); template:
`ingestion/sources/_template.json`.

| Field | Purpose |
|---|---|
| `id`, `name`, `publisher` | identity; becomes source record `src-ing-<id>` |
| `kind` (`file` · `http`), `location`, `format` (`csv` · `json`), `json_path` | where and how to read |
| `target_entity` | `laser_source` · `optic` · `galvo` · `company` · `component` |
| `data_type` | `PUBLIC` or `EXTERNAL` |
| `license`, `terms_url` | what permits use |
| `permission{basis, reviewed_by, reviewed_at, notes}` | basis ∈ open-data-licence · public-download-permitted · licensed-api · manufacturer-provided · written-permission — **required** |
| `enabled` | false until the manifest review is merged |
| `rate_limit_ms` | ≥ 1000 ms |
| `key_columns` | row identity for dedupe/evidence |
| `mapping` | target field → column, or `{column, type: string·number·quantity·list·boolean, unit, separator, items}` or `{constant}` (a reviewer-set value, recorded as such in evidence with LOW confidence) |

## Refusals (by design)

| Situation | Behaviour |
|---|---|
| no manifest / `enabled: false` | not fetched |
| plain http, file outside `ingestion/inbox/` | refused |
| robots.txt disallows our user agent, or robots.txt returns 5xx / is unreachable | refused (RFC 9309) |
| 401 · 402 · 403 · 407 | refused — authentication and paywalls are not bypassed |
| 429 | refused — try later |
| 3xx | refused — review the final URL and update the manifest |
| CAPTCHA / bot-challenge page | run stops |
| > 20 MB | refused — use a bulk download or licensed API |
| unreadable value | stays UNKNOWN; row problem reported; never guessed |
| row without key, conflicting duplicate rows | held back in REVIEW.md |
| differs from master | CONFLICTED candidate with diff — master is never overwritten by the pipeline |

User agent: `TEAL-Intelligence-Ingestion/1.0 (+https://github.com/songarajatin225-a11y/TEAL-Intelligence-)`.

## Running

```bash
npm run ingest:discover            # list and validate manifests
npm run ingest -- <source-id>      # or no id = all enabled sources
```

GitHub: *Actions → Ingestion (manual) → Run workflow* uploads `ingestion-candidates` as an
artifact. The workflow has read-only permissions and cannot commit.

## Status

The pipeline is implemented and tested (`tests/unit/ingestion.test.ts`, with a fictional,
test-only fixture). **No external source is enabled yet** — the first one needs a reviewed
manifest. Until then, no external product data exists in `/data`, and the UI says so.
