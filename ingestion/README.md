# Ingestion (external engineering data)

External data enters the OS only through this reviewed pipeline (spec §21–§22, §100–§101).
The GitHub Pages app never scrapes the web.

```
source manifest (reviewed PR) → fetchSource → raw snapshot → parseProduct → normalizeCompany/normalizeProduct
  → deduplicate (vs. master: new / changed = CONFLICTED / unchanged) → generateEvidence → validateDataset
  → ingestion/candidates/<source>/ (REVIEW.md) → pull request → human approval → merge into /data → deploy
```

## Add a source

1. Copy `sources/_template.json` to `sources/<id>.json` and fill it in. `permission` records who
   checked the licence / terms of use / robots.txt, when, and on what basis the facts may be stored
   in this **public** repository. Leave `enabled: false` until that review is merged.
2. For file sources, put the file in `inbox/` (git-ignored — third-party files are not republished).
3. `npx tsx scripts/ingestion/discoverSources.ts` — lists sources and validates manifests.
4. `npx tsx scripts/ingestion/runIngestion.ts <id>` — writes `candidates/<id>/` with the candidate
   dataset, evidence, source record and `REVIEW.md`.
5. Review `REVIEW.md`, move accepted records into the right `/data` dataset, run
   `npm run data:validate && npm run data:quality`, and open a pull request.

## What the pipeline refuses

- sources without a manifest, disabled sources, non-https URLs, files outside `inbox/`
- anything `robots.txt` disallows for our user agent (RFC 9309; unreachable robots.txt = disallowed)
- 401 / 402 / 403 / 407 (authentication, paywall) and 429 (rate limit) — never worked around
- CAPTCHA / bot-challenge pages, silent redirects, responses over 20 MB
- values it cannot read: they stay UNKNOWN and the row is reported, never guessed

Master data is never overwritten by ingestion: differences from master become CONFLICTED
candidates with a field-by-field diff for the reviewer.
