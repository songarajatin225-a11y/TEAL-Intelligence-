# Laser Applications Product Manager — Operating Tracker

A complete, self-contained operating system for a laser applications product manager:
daily activities, customers, applications, products, laser diode localization and R&D,
samples/demos/trials, meetings and follow-ups, suppliers/partners, competitor intelligence,
daily logs, weekly reviews and reports — with a live dashboard built entirely from your own data.

It is a **static web application**: HTML, CSS and vanilla ES6+ JavaScript, storing everything
in the browser's **IndexedDB**. No backend, no build step, no API keys, no server. It runs from
GitHub Pages, from any static host, or from a folder on your machine served over `http://localhost`.

---

## Contents

- [Quick start](#quick-start)
- [Local testing](#local-testing)
- [GitHub Pages deployment](#github-pages-deployment)
- [How the app is organised](#how-the-app-is-organised)
- [Data and storage](#data-and-storage)
- [Backup and restore](#backup-and-restore)
- [Security — read this](#security--read-this)
- [Customisation](#customisation)
- [Automatic business logic](#automatic-business-logic)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [File structure](#file-structure)
- [Future upgrade path (Supabase / Firebase)](#future-upgrade-path-supabase--firebase)
- [Browser support and known limitations](#browser-support-and-known-limitations)

---

## Quick start

**Clone**

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
```

**Or download**: on GitHub choose *Code → Download ZIP* and unzip it.

Then serve the folder (see below) and open `index.html`. On first run you create a local
username and password, and can optionally load a small demonstration dataset.

---

## Local testing

The app needs to be served over `http://` (or `https://`) rather than opened as a `file://`
path, because browsers restrict Web Crypto and `fetch` on the file system. Any static server works:

```bash
# Python 3 (no install needed on most systems)
python3 -m http.server 8080

# Node.js
npx http-server -p 8080 -c-1

# PHP
php -S localhost:8080
```

Then open <http://localhost:8080/>.

`localhost` counts as a secure context, so password hashing (Web Crypto) works exactly as it
does on GitHub Pages. If you open the files directly (`file://…`), the app detects it and
explains what to do instead of failing silently.

---

## GitHub Pages deployment

1. Push this repository to GitHub (the files must be in the repository **root**).
2. Go to **Repository → Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Select branch **main** and folder **/ (root)**.
5. Click **Save**.
6. Wait for the green deployment tick, then open:

```
https://USERNAME.github.io/REPOSITORY/
```

Everything uses **relative paths**, so the app works from a repository subdirectory without any
configuration. A `.nojekyll` file is included so GitHub Pages serves all files as-is.

The only external resource is Chart.js, loaded over HTTPS from a CDN. If the CDN is unreachable
(offline, restricted network), the dashboard replaces each chart with a short explanation and
every number, panel and report keeps working.

---

## How the app is organised

| Page | What it is for |
|---|---|
| **Dashboard** | Ten live KPIs, four charts and six action panels: today's priorities, follow-ups due, upcoming deadlines, overdue, management attention, top opportunities. Every KPI is clickable and opens the matching filtered records. |
| **Activities** | The master activity tracker — the day-to-day work list, with workstream, priority, status, dates, customer, blocker, opportunity value and next action. |
| **Daily Log** | A fast end-of-day capture: top 3 priorities, meetings, calls, technical/R&D work, achievements, issues, blockers, decisions and tomorrow's priority. Shows what is due today alongside. |
| **Weekly Review** | The eleven review sections plus an automatic current-week vs previous-week KPI comparison. "Auto-fill from data" drafts each section from what actually happened. |
| **Customers** | Customer and partner database: contacts, technical requirement, current supply position, opportunity stage, value, probability and interactions. |
| **Meetings** | Meeting records with actions, owners and due dates, plus a **Generate Follow-up** composer that produces an editable, professional follow-up message you can copy to the clipboard. Nothing is ever sent automatically. |
| **Suppliers / Partners** | Engagement status, NDA, sample and pricing discussions, manufacturing capability, localization potential. |
| **Competitors** | Market intelligence entries with threat level, technology advantage/gap and required action. |
| **Applications** | Laser application database (LiDAR, LRF, EO/IR, optical communication, fibre laser pump, industrial, medical, …) with the full laser requirement and qualification needs. |
| **Products** | Part-number database with specification, availability, MOQ, lead time, fit and localization potential. |
| **Localization & R&D** | The high-priority import-substitution module: an eleven-stage pipeline (Concept → Production), technology gaps, capability, cost comparison, localization % and management support. |
| **Samples / Trials** | The full sample lifecycle (Requested → Closed) with dispatch/delivery/demo/trial dates, results, issues and corrective actions. |
| **Reports** | Ten reports (daily, weekly, monthly, customer pipeline, opportunity pipeline, localization, R&D, samples, overdue, management attention) with date filtering, CSV export and print layouts. |
| **Settings** | Theme, working preferences, password/username, session controls, backup/restore, CSV import/export, demonstration data and reset. |

**Everywhere**: global search across all nine record types, Quick Add, a notification panel for
overdue/follow-up/upcoming/critical items, light/dark/system themes, and full keyboard and
mobile support.

---

## Data and storage

- **IndexedDB** (`laser_pm_tracker`, schema version 1) holds every record: `activities`,
  `customers`, `applications`, `products`, `localization`, `samples`, `meetings`, `suppliers`,
  `competitors`, `dailyLogs`, `weeklyReviews` and `settings`.
- **localStorage / sessionStorage** hold only preferences and session metadata — theme,
  page size, currency, inactivity timeout, and the current session token. Never record data.
- Data lives **only in the browser that created it**. It is not uploaded anywhere. A different
  browser, a different device, or clearing site data means an empty database — use the JSON
  backup to move data between them.
- Records are written with an internal id plus a readable code (`ACT-0007`, `LOC-0002`, …),
  a creation date and a last-updated timestamp.

---

## Backup and restore

**Settings → Data Management**

| Action | What it does |
|---|---|
| **Export full JSON** | One file with `schemaVersion`, `exportDate` and every record from every module plus your settings. Your password hash is deliberately **excluded**. |
| **Import JSON (replace)** | Validates the file, shows what it contains, asks for confirmation, then replaces the data. |
| **Import JSON (merge)** | Adds/updates records by id and keeps everything else. |
| **Export CSV** | Per module, with every field plus the derived columns (days remaining, overdue, aging, follow-up due, weighted value). |
| **Import CSV** | Per module. Column headings are matched against the field labels — export a module first and use that file as your template. |
| **Load / delete demonstration data** | A small tagged sample dataset you can add or remove at any time. |
| **Reset database / Reset everything** | Destructive, confirmation-gated resets (records only, or records + login + preferences). |

Imports are validated **before** anything is written: a file that is not a tracker backup is
rejected with an explanation and your data is left untouched.

Back up before clearing site data, changing browsers, or resetting.

---

## Security — read this

> **This authentication protects the application interface and local browser data. It is not
> equivalent to server-side authentication and should not be used as a security boundary for
> confidential shared data.**

What the app does:

- Passwords are **never stored**. Only a **PBKDF2-SHA256** hash (210,000 iterations, 256-bit,
  random 16-byte salt per password) computed with the **Web Crypto API** is kept in IndexedDB.
- Sessions expire, lock after a configurable period of inactivity (default 30 minutes) and can
  be locked on demand. Unlocking requires the password again.
- Password changes re-derive the hash with a fresh salt; the old hash is discarded.
- No API keys, tokens, service-role keys or credentials exist anywhere in the source.
- CSV exports neutralise spreadsheet formula injection.

What it cannot do, because GitHub Pages is static hosting:

- It cannot stop someone with access to this computer profile from reading the IndexedDB
  database directly through developer tools. The login gates the interface, not the storage.
- There is no password recovery. If you forget the password, the only route is a full reset
  (Settings → Reset everything, or clearing site data), which deletes the local data — so keep
  a JSON backup.
- Do not use it to store material that would be damaging if read by anyone who can use your
  computer, and do not treat it as a shared, access-controlled system of record.

---

## Customisation

Everything you are likely to want to change lives in **`js/schema.js`**.

**Dropdown values** — the `V` object at the top of the file:

```js
var V = {
  status: ['Not Started', 'In Progress', /* … */],
  priority: ['Critical', 'High', 'Medium', 'Low'],
  workstream: ['Customer Development', /* … */],
  applicationCategory: ['LiDAR', 'Laser Range Finder', 'Target Designation', /* … */],
  laserType: ['Laser Diode', 'Diode Bar', 'VCSEL', /* … */],
  localizationStage: ['Concept', 'Technology Evaluation', /* … */, 'Production'],
  // …
};
```

Add or rename a value and it appears immediately in every form, filter, badge and chart.
Records holding a value that is no longer in the list keep it — the edit form shows it as
`(custom)` so nothing is silently lost.

**Fields and tables** — each module is declared just below, for example:

```js
ENTITIES.activities = {
  store: 'activities', page: 'activities.html', codePrefix: 'ACT',
  sections: [ /* form fields, grouped */ ],
  columns:  [ /* which columns the table shows */ ],
  filters:  [ 'status', 'priority', 'customer', 'workstream', 'owner', 'application', 'dateRange' ],
  derive:   { target: 'targetDate', follow: 'nextActionDate', status: 'status' }
};
```

- `sections` drives the create/edit form **and** the detail view **and** the CSV columns.
- `columns` chooses the table columns (`type` may be `badge`, `date`, `value`, `percent`,
  `days`, `code`, `number`, `title`).
- `derive` tells the app which date drives *overdue* and *follow-up due* for that module.
- Adding a field is a one-line change; no other file needs editing.

**Badge colours** — the `TONE` map in the same file.
**Theme colours, spacing, radius** — the CSS variables at the top of `css/style.css`.
**Navigation and Quick Add** — the `NAV` and `QUICK_ADD` arrays at the bottom of `js/schema.js`.

---

## Automatic business logic

Calculated on read, never stored stale, and safe against missing or malformed dates:

| Derived value | Rule |
|---|---|
| **Overdue** | `targetDate < today` **and** the record is not in a closed status |
| **Follow-up due** | `nextActionDate <= today` **and** the record is not in a closed status |
| **Days remaining** | `targetDate − today`, in whole days |
| **Aging** | `today − dateAdded`, in whole days |
| **Weighted opportunity** | `estimatedOpportunityValue × probability%` |
| **Due this week** | target date within the next 7 days |
| **Management attention** | management support requested, status *Blocked*, a non-empty blocker, or *Critical* priority while open |

Each module states which of its dates drives these rules (`derive` in `js/schema.js`), so
localization uses *Target Completion*, samples use *Required Date*, meetings use *Due Date*,
and so on. Missing dates simply produce “—”, never `NaN` or a broken row.

---

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `Ctrl`/`⌘` + `K` | Focus global search |
| `↑` `↓` | Move through search results |
| `Enter` | Open the focused row or search result |
| `Esc` | Close the topmost dialog, drawer, menu or search panel |
| `Ctrl`/`⌘` + `Enter` | Save the open record form |
| `Ctrl`/`⌘` + `S` | Save the daily log (on the Daily Log page) |
| `Tab` | Cycles inside the open dialog (focus is trapped and restored on close) |

---

## File structure

```
/
├── index.html              # sign-in / first-time setup
├── dashboard.html          # operating dashboard
├── activities.html         # master activity tracker
├── customers.html          # customer & partner database
├── applications.html       # laser application database
├── products.html           # product / part-number database
├── localization.html       # laser diode localization & R&D
├── samples.html            # sample / demo / trial tracker
├── meetings.html           # meetings & follow-ups
├── suppliers.html          # suppliers / partners
├── competitors.html        # competitor & market intelligence
├── daily-log.html          # daily log
├── weekly-review.html      # weekly review
├── reports.html            # reports & exports
├── settings.html           # preferences, security, data management
│
├── css/
│   ├── style.css           # design tokens, shell, components
│   ├── dashboard.css       # dashboard, charts, reports, review, print
│   └── responsive.css      # tablet and mobile behaviour
│
├── js/
│   ├── utils.js            # dates, formatting, business logic, CSV
│   ├── database.js         # IndexedDB layer (the only storage-aware file)
│   ├── schema.js           # vocabularies + all module definitions
│   ├── auth.js             # Web Crypto authentication and session
│   ├── ui.js               # reusable components (modal, drawer, table, toast…)
│   ├── crud.js             # generic list pages, forms, detail drawers
│   ├── export.js           # CSV/JSON export, import and sample data
│   ├── app.js              # shell: nav, search, quick add, notifications
│   ├── login.js            # setup / sign-in page
│   ├── dashboard.js        # KPIs, charts, action panels
│   ├── activities.js       # module pages (thin — configuration only)
│   ├── customers.js
│   ├── applications.js
│   ├── products.js
│   ├── localization.js     # + pipeline summary
│   ├── samples.js          # + lifecycle summary and stage advance
│   ├── meetings.js         # + follow-up composer
│   ├── suppliers.js
│   ├── competitors.js
│   ├── daily-log.js
│   ├── weekly-review.js
│   ├── reports.js
│   └── settings.js
│
├── data/
│   └── sample-data.json    # small demonstration dataset (dates are relative)
│
├── assets/
│   └── favicon.svg
│
├── .nojekyll
└── README.md
```

Module pages are deliberately thin: `crud.js` builds list pages, forms, validation, filters,
sorting, pagination and detail drawers from the declarations in `schema.js`, so a new module
is a schema entry plus a few lines of page script.

---

## Future upgrade path (Supabase / Firebase)

The UI never touches IndexedDB directly — every read and write goes through `LPM.db.*` in
`js/database.js`, and authentication goes through `LPM.auth.*` in `js/auth.js`. To move to a
hosted backend you replace those two files and keep everything else:

**1. Storage.** Implement the same contract in a new `database.js`:

```
initDB()            addRecord(store, rec)     getRecord(store, id)
getAllRecords(store)  getMany(stores)         updateRecord(store, rec)
deleteRecord(store, id)  deleteMany(store, ids)  bulkAdd(store, rows)
searchRecords(store, q, fields)   count(store)
getSetting(k, fallback)   setSetting(k, v)
exportDatabase()    validateImport(payload)   importDatabase(payload, opts)
clearDatabase(stores)     onChange(listener)
```

Every function returns a Promise, so a network round-trip is a drop-in replacement for a
local transaction. The store names map cleanly onto Supabase tables or Firestore collections,
and each record already carries `id`, `code`, `createdAt`, `updatedAt` and `dateAdded`.
Call the `onChange` listeners from your realtime subscription and the dashboard, notifications
and open tables refresh themselves.

**2. Authentication.** Implement the same contract in a new `auth.js`:

```
isSetupComplete()   setup(user, pw, confirm)   login(user, pw, remember)
unlock(pw)          logout()                   changePassword(cur, new, confirm)
isAuthenticated()   sessionState()             currentUser()   touch()   lockSession()
getPrefs()          setPrefs(patch)
```

Back it with Supabase Auth or Firebase Auth. Because `app.js` only asks
“is there a session, is it locked, who is it?”, the sign-in page, lock overlay, session timeout
and account menu keep working unchanged.

**3. Migration.** Export a full JSON backup from the current app and load it into the new
backend — the payload is already grouped by store with stable ids.

Keep API keys out of the repository: a hosted backend needs a real environment
(a build step, edge functions, or a host that injects configuration), not a static GitHub Pages site.

---

## Browser support and known limitations

**Supported**: current Chrome, Edge, Firefox and Safari on desktop, tablet and Android/iOS phones.
Requires IndexedDB and Web Crypto — both are standard in every current browser.

**Limitations, stated plainly**

- Data is per browser and per device. There is no sync; the JSON backup is the transfer mechanism.
- Private/incognito windows may block IndexedDB. The app detects this and says so rather than
  losing data quietly.
- Client-side authentication is an interface gate, not a security boundary (see
  [Security](#security--read-this)).
- There is no password recovery by design — keep a backup.
- Charts need the Chart.js CDN; without it the dashboard falls back to text and everything else
  is unaffected.
- Wide data tables scroll horizontally on desktop (row actions stay pinned to the right edge);
  on phones those tables render as stacked cards instead.

---

**Version** 1.0.0 · Database schema version 1 · No dependencies other than Chart.js (CDN, charts only).
