# Security

V1 is a **static site on GitHub Pages built from a public repository**. There is no backend, no
database server and no authentication server. Security therefore rests on one rule: **nothing
confidential goes into the repository or the published site.**

## 1. The repository and the site are public

Anything committed — code, `/data`, `/knowledge`, `public/legacy/` — is readable by anyone, and
so is everything the site serves. Never commit or publish:

passwords · API keys · tokens · customer confidential information · NDA material · private
quotations · customer drawings · confidential BOMs or real cost rates · trade secrets · personal
information.

### ⚠️ Owner decision needed: the TEAL handbooks

`knowledge/handbooks/**` contains the full text of three TEAL handbooks (Laser, Automation
Equipment Building, Semiconductor Industry), converted from the supplied `.docx` files, and
several datasets are extracted from them (gates, formulas, evidence, value chain, companies,
technologies, checklists). The documents carry no confidentiality marking, but they are TEAL
material. **Confirm they may be public.** If not:

1. make the repository private (GitHub Pages from a private repository needs a plan that
   supports it, and the Pages site itself may still be public unless access control is
   available on that plan), **or**
2. remove `knowledge/handbooks/` and the handbook-derived datasets, rewrite history if they
   must disappear from Git, and host them privately.

Likewise, the legacy data that was already public in the legacy repositories (platform
base-price ESTIMATES, DEMO item prices and rates, real vendor names) was migrated with those
labels. The legacy cost platform's seeded projects — real customer names with illustrative
jobs — were deliberately **not** migrated or re-published.

### Guards in the tooling

| Guard | Where |
|---|---|
| Secret scan (OpenAI/Anthropic/AWS/GitHub key patterns, private keys) fails CI | `.github/workflows/validate.yml` |
| `applyChangePackage` refuses customer-type records (customers, opportunities, requirements, cost models, BOMs, RFQs, projects, POCs, DOEs, protocols, machines, tickets) unless `--i-confirm-not-confidential` | `scripts/data/applyChangePackage.ts` |
| Ingestion raw files and candidates are git-ignored | `.gitignore` |
| Legacy handbook `.docx` sources are git-ignored | `.gitignore` |

## 2. No fake authentication

The optional **LOCAL WORKSPACE LOCK** (Admin → Data management) is a screen lock for a shared
computer, and is labelled as such everywhere:

* the passphrase is never stored; a PBKDF2-SHA-256 hash (210 000 iterations, random salt) is kept
  in this browser's IndexedDB;
* anyone with access to the browser profile or developer tools can bypass it;
* it does **not** encrypt the workspace and protects nothing on GitHub Pages;
* it is excluded from workspace backups.

The legacy simulator's admin PIN (readable in page source) was removed from the embedded copy
and not migrated.

## 3. Local data in the browser

Local drafts, backups and change packages are **plain, unencrypted** data:

* IndexedDB is per *origin*. All GitHub Pages sites of one account share the origin
  `https://<account>.github.io`, so **any page published under that account can read this app's
  workspace** (and the legacy apps' storage — which is exactly how the legacy import works).
  Do not publish untrusted pages under the same account if the workspace holds sensitive drafts.
* Workspace backups and change packages are ordinary files — store and share them as you would
  the data they contain.
* Clearing site data deletes drafts; export a backup first.

## 4. AI

The core platform does not depend on AI and contains **no AI keys**. The *AI context generator*
only builds text for you to copy into an assistant of your choice. Do not paste confidential
context into a public AI service; the prompts themselves instruct the assistant not to invent
data.

## 5. External data

The frontend makes no requests to third-party sites and performs no scraping. External data
comes only through the reviewed ingestion pipeline, which respects robots.txt, terms of use,
copyright, rate limits and authentication boundaries, and never bypasses paywalls or CAPTCHA
([INGESTION.md](INGESTION.md)). Google Fonts are loaded only by the embedded legacy simulator.

## 6. Application hardening

* React escaping everywhere; the Markdown renderer builds React elements — no raw HTML, no
  `dangerouslySetInnerHTML`, no `eval`.
* CSV export escapes cells starting with `=`, `+`, `-`, `@` (formula injection).
* Imports (JSON/CSV, backups, change packages, legacy data) are schema-validated before anything
  is stored; batches are all-or-nothing; file size limited to 25 MB.
* External links use `rel="noreferrer"`.
* The service worker caches only same-origin app files and data; it does not touch `/legacy/`.

## 7. When confidential data must be in the system

That is outside V1. It needs a private deployment with real authentication and access control
(for example an `ApiRepository` behind company SSO) — see
[06_IMPLEMENTATION_ROADMAP.md](06_IMPLEMENTATION_ROADMAP.md), P2.

## Reporting

Report a security problem privately to the repository owner rather than in a public issue.
