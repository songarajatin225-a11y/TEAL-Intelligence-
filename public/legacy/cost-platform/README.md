# TEAL — Costing & Estimation Platform (HTML build)

Plain HTML, CSS and JavaScript. **No framework, no build step, no Node.** Open the
folder on any web server and it runs.

```
index.html
assets/app.js        the whole application
assets/styles.css    the stylesheet
assets/favicon.svg
data/config.json     company, branding, business units, categories, roles, defaults
data/masters.json    rates, vendors, customers, currency, tax, freight, plants, approval matrix
data/projects.json   seeded projects, templates and audit trail
```

---

## Deploy to GitHub Pages

Because there is no build step you can use the simple branch deployment — no Actions,
no workflow file.

1. Create a repository on github.com (Private is fine). Do not add a README.
2. **Add file → Upload files**, drag in `index.html`, `README.md` and the `assets`
   and `data` folders, then **Commit changes**.
3. **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `/ (root)` → Save.**
4. Wait about a minute. The URL appears at the top of that same Pages screen.

To publish a change later, edit the file on GitHub (pencil icon) or upload a new copy.
The site updates within a minute.

## Run it on your own machine

The page reads the JSON files over HTTP, and browsers block that when a page is opened
straight from disk. Serve the folder instead — from inside it:

```
python -m http.server 8080
```

Then open <http://localhost:8080>. If you double-click `index.html` you will get a
message explaining this rather than a blank screen.

---

## The JSON backend

`data/*.json` is the editable source of truth. Change a machine hour rate, add a vendor,
add a business unit or seed a project by editing those files in any text editor — no code
changes.

**How state flows**

- On first load the app reads the three JSON files.
- Edits made in the app are kept in the browser's local storage, so they survive a refresh.
- **Masters → Export JSON** and **Audit → Export JSON** download the current state in the
  same shape as the files in `data/`. Replace the originals with the downloads and commit
  to make them the new baseline for everyone.
- **Roles & access → Reset to the JSON baseline** discards local edits and reloads the files.

This is a static-hosting pattern: everyone sees the same starting data, and each person's
working edits are their own. When several people need to edit the *same* live figures, the
JSON files need to be replaced by a real API — `TEAL_Costing_Schema.sql` in the React build
carries the matching Postgres model.

---

## Password protection

Off by default. To turn it on, encrypt the data files into a vault — after that the
platform will not start without the passphrase, because the cost data is genuine
AES-256-GCM ciphertext rather than a password check that can be skipped.

**Turning it on**

1. Serve the folder (`python -m http.server 8080`) and open **encrypt.html**.
2. Click **Load current data/ files** — or pick the three JSON files by hand.
3. Enter the passphrase twice. Four random words beats one clever word.
4. **Generate vault.enc** and save the download into `data/`.
5. **Delete `data/config.json`, `data/masters.json` and `data/projects.json` from the
   repository.** If you leave them, the plaintext is still public and the vault is pointless.
6. Commit. The site now opens on a lock screen.

**Changing data or the passphrase later**

Open `encrypt.html`, switch to **Decrypt**, supply `vault.enc` and the passphrase — it gives
the three JSON files back. Edit them, then encrypt again (with a new passphrase if you are
rotating it) and replace `vault.enc`.

**How it behaves**

- The passphrase is never stored or transmitted. The key is derived in the browser with
  PBKDF2-SHA256 at 310,000 iterations against a random salt.
- Once unlocked, the key stays in that tab's session storage, so a refresh does not
  re-prompt. Closing the tab clears it. The padlock in the top bar locks immediately.
- Your working edits in local storage are encrypted with the same key, so nothing readable
  is left on a shared machine.
- Encryption needs a secure context: `https://` or `localhost`. GitHub Pages is https.

**What this does and does not do**

It stops anyone who finds the URL from reading your rates, margins and customer list. That is
the realistic threat for a public Pages site, and it handles it properly.

It is not user accounts. Everyone shares one passphrase, there is no per-person audit of who
opened the site, and a person who leaves keeps the passphrase until you rotate it. The role
selector remains a workflow guard, not a security control. When you need real accounts and
shared live data, that is the Supabase or internal-server step.

## Branding

**Roles & access → Branding & Identity** — upload the logo there. The file is embedded into
the configuration as a data URI, so it needs no separate asset and travels with
`config.json`. One upload drives the sidebar, the lock screen and the printed letterhead.
Upload a light-on-dark variant if the mark disappears against the dark theme, then
**Export config.json** and replace the file in `data/` so the whole team picks it up.

You can also set it by hand in `data/config.json`:

```json
"brand": { "logo": "assets/teal-logo.png", "logoDark": "" }
```

Leave it empty to keep the typographic mark.

## Keyboard

| | |
|---|---|
| `Ctrl` / `⌘` + `K` | Command palette — jump to any project, screen, module or action |
| `↑` `↓` `Enter` | Move down a column in any costing grid |
| `Ctrl` / `⌘` + `D` | Fill down from the cell above |
| `Esc` | Close a dialog, panel or the palette |

Deleting a line, project, template or master record offers **Undo** for a few seconds
rather than a confirmation prompt.

## Item master — TEAL stock codes

`Master data → Item Master` is the priced catalogue that sits behind every quotation,
independent of any project. Each record holds:

`code · description · specification · category · class · UOM · price · currency · preferred vendor · lead time · MOQ · HSN · price date · status`

- **On a BOM line**, the **Stock code** cell is a live typeahead over the catalogue. Pick a
  code and the description, specification, UOM, price, currency and vendor fill themselves —
  only the quantity is yours.
- **Catalogue** in the module header opens a browser: search across code, description,
  specification, vendor or MPN, filter by category, tick several, add them as lines. It also
  shows how many projects already consume each code.
- **Importing a BOM with stock codes prices itself.** The preview reports how many lines
  matched before anything is written. Values your file supplies explicitly override the
  catalogue; everything else comes from it.
- **Import CSV** on the Item Master loads or refreshes the catalogue from a spreadsheet
  export, with the same automatic column matching.
- **Re-price** pulls a whole BOM back to current catalogue prices in one action, with Undo.
- Lines priced away from the catalogue are marked, and records older than 180 days are
  flagged as stale wherever they are used.
- The **Catalogue Discipline** panel on the Material module reports coverage: how many lines
  and how much value sit on a maintained code rather than an ad-hoc figure.

Because the catalogue is a master table, `Export JSON` writes it back into `data/masters.json`
for committing as the team baseline.

## Analysis on the cost summary

Beyond the build-up itself, three panels answer the questions that actually get asked in a
price review:

- **Price to win** — enter the number the customer needs and it back-solves the mark-up and
  the margin that implies. **Apply mark-up** commits it.
- **Cost drivers** — the twenty largest lines across all nine modules with a running share of
  direct cost. Tells you which quotations to firm up before committing to a price.
- **Margin sensitivity** — holds the price and swings material, labour, engineering, FX and
  site cost by realistic amounts. Anything that would drop the job below its approval floor is
  flagged.

## In-app guide

**How to use** in the sidebar (or the page icon in the top bar) carries the full working guide:
the exact calculation sequence, what belongs in each module, approvals, revisions, masters,
export and shortcuts. Point new users there rather than writing a separate document.

## Notes

- Reports print through the browser (Ctrl/Cmd-P → Save as PDF). Screen chrome is suppressed
  and a letterhead is added automatically.
- CSV export and Excel/CSV import both run in the browser — nothing is uploaded anywhere.
- Charts are drawn as inline SVG; there are no third-party libraries at all.
- GitHub Pages is public by default on free plans. For live cost data use an organisation
  plan with Pages restricted to members, or host the folder on the TEAL intranet.
