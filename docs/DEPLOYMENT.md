# Deployment

## GitHub Pages (production)

1. **Settings → Pages → Build and deployment → Source: GitHub Actions** (one-time).
2. Push to `main`. `.github/workflows/deploy.yml` runs:
   `validate` (reusable) + `test` (reusable, incl. Playwright) → `build` (`npm run build`,
   `actions/upload-pages-artifact` with `dist/`) → `deploy` (`actions/deploy-pages`).
3. The site is served at `https://<owner>.github.io/<repo>/` —
   `https://songarajatin225-a11y.github.io/TEAL-Intelligence-/` for this repository.

`vite.config.ts` sets `base` to `/<repo>/` from `GITHUB_REPOSITORY` in CI (fallback
`/TEAL-Intelligence-/`). Routing uses hashes (`#/products`), so deep links work without server
rewrites. The embedded legacy apps are at `/<repo>/legacy/<app>/index.html`.

A deploy only happens when validation (schemas, stale generated files, secret scan, typecheck,
lint), unit/integration tests and E2E tests pass.

## Other workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `validate.yml` | push to main, PRs | data validation, generated files current, secret scan, typecheck, lint |
| `test.yml` | push to main, PRs | vitest (unit + integration); Playwright E2E on the production build (report uploaded on failure) |
| `build.yml` | PRs | full build, `dist/` as an artifact for review |
| `data-quality.yml` | data changes, weekly (Mon 03:17 UTC), manual | quality report in the job summary + artifact; errors fail |
| `search-index.yml` | data / knowledge changes, manual | rebuild indexes + graph, partition sizes in the summary |
| `ingestion.yml` | manual only | runs enabled sources, uploads review candidates; cannot commit |

## Local

```bash
npm ci
npm run dev        # http://localhost:5173/ (base "/" in dev)
npm run build && npx vite preview   # http://localhost:4173/TEAL-Intelligence-/
```

## Updating

* **Code / data / knowledge** — pull request → CI → merge → automatic deploy.
* **Legacy apps** — re-run `LEGACY_ROOT=<clones> npm run legacy:embed` after the legacy
  repositories change; review the diff (sanitisation is re-applied).
* Users get the new version on reload: navigation and data are network-first; the cached copy
  is used only offline.

## Rollback

Revert the offending commit on `main` (or re-run the deploy workflow on an earlier commit via
*Run workflow*). Browser workspaces are unaffected — they live in each user's IndexedDB.
