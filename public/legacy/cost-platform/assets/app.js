/* ===========================================================================
   TEAL — Costing & Estimation Platform
   Vanilla HTML/CSS/JS. No framework, no build step, no bundler.

   Data lives in /data/*.json — edit those files to change rates, vendors,
   customers, business units or seeded projects without touching code.
   Runtime edits are held in localStorage; Export JSON writes them back out
   so they can be committed as the new baseline.
   ========================================================================= */

/* ------------------------------- ICONS ---------------------------------- */
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="8" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="18"/><line x1="8" y1="18" x2="12" y2="18"/>',
  layers: '<polygon points="12,3 21,8 12,13 3,8"/><polyline points="3,13 12,18 21,13"/>',
  database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  file: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><polyline points="14,2 14,7 19,7"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>',
  shield: '<path d="M12 3l7 3v6c0 4.2-2.9 7.4-7 8.4-4.1-1-7-4.2-7-8.4V6z"/><polyline points="9,12 11,14 15,10"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3,4 3,9 8,9"/><polyline points="12,7 12,12 15.5,14"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>',
  sun: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="5" y1="5" x2="6.5" y2="6.5"/><line x1="17.5" y1="17.5" x2="19" y2="19"/><line x1="5" y1="19" x2="6.5" y2="17.5"/><line x1="17.5" y1="6.5" x2="19" y2="5"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  trash: '<polyline points="3,6 21,6"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,8 12,3 17,8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  printer: '<polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  right: '<polyline points="9,5 16,12 9,19"/>',
  left: '<polyline points="15,5 8,12 15,19"/>',
  check: '<polyline points="4,12 9,17 20,6"/>',
  x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  alert: '<path d="M12 3l9.5 17H2.5z"/><line x1="12" y1="9" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="17"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  package: '<path d="M21 8v8l-9 5-9-5V8l9-5z"/><polyline points="3,8 12,13 21,8"/><line x1="12" y1="13" x2="12" y2="21"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="1"/><rect x="10" y="10" width="4" height="4"/><line x1="9" y1="2" x2="9" y2="6"/><line x1="15" y1="2" x2="15" y2="6"/><line x1="9" y1="18" x2="9" y2="22"/><line x1="15" y1="18" x2="15" y2="22"/><line x1="2" y1="9" x2="6" y2="9"/><line x1="2" y1="15" x2="6" y2="15"/><line x1="18" y1="9" x2="22" y2="9"/><line x1="18" y1="15" x2="22" y2="15"/>',
  wrench: '<circle cx="12" cy="12" r="3.4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="5.5" y1="5.5" x2="8" y2="8"/><line x1="16" y1="16" x2="18.5" y2="18.5"/><line x1="5.5" y1="18.5" x2="8" y2="16"/><line x1="16" y1="8" x2="18.5" y2="5.5"/>',
  code: '<polyline points="9,7 4,12 9,17"/><polyline points="15,7 20,12 15,17"/>',
  factory: '<path d="M3 21V10l6 3.5V10l6 3.5V6l6 3v12z"/><line x1="7" y1="17" x2="7" y2="17"/><line x1="12" y1="17" x2="12" y2="17"/><line x1="17" y1="17" x2="17" y2="17"/>',
  users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.4 3.4 0 0 1 0 5.6"/><path d="M17.5 14.2A6.5 6.5 0 0 1 21.5 20"/>',
  ruler: '<rect x="2" y="8" width="20" height="8" rx="1"/><line x1="7" y1="8" x2="7" y2="12"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="17" y1="8" x2="17" y2="12"/>',
  truck: '<rect x="1" y="6" width="13" height="10" rx="1"/><path d="M14 9h4l3 3.5V16h-7z"/><circle cx="6" cy="18.5" r="2"/><circle cx="17.5" cy="18.5" r="2"/>',
  receipt: '<path d="M5 2h14v20l-2.3-1.6L14.4 22 12 20.4 9.6 22l-2.3-1.6L5 22z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/>',
  lifebuoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/><line x1="5.7" y1="5.7" x2="9.5" y2="9.5"/><line x1="14.5" y1="14.5" x2="18.3" y2="18.3"/><line x1="18.3" y1="5.7" x2="14.5" y2="9.5"/><line x1="9.5" y1="14.5" x2="5.7" y2="18.3"/>',
  filter: '<polygon points="3,4 21,4 14,12.5 14,20 10,17.5 10,12.5"/>',
  sort: '<polyline points="7,9 10,6 13,9"/><polyline points="11,15 14,18 17,15"/>',
  send: '<polygon points="21,3 3,10.5 10,13.5 13,21"/>',
  rotate: '<path d="M3 12a9 9 0 1 1 3 6.7"/><polyline points="3,17 3,12 8,12"/>',
  compare: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5V15a3 3 0 0 0 3 3h6"/><path d="M18 15.5V9a3 3 0 0 0-3-3H9"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><line x1="8" y1="7" x2="8" y2="7"/><line x1="12" y1="7" x2="12" y2="7"/><line x1="16" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><path d="M10 21v-4h4v4"/>',
  save: '<path d="M4 4h12l4 4v12H4z"/><polyline points="8,4 8,10 15,10"/><rect x="8" y="14" width="8" height="6"/>',
  bell: '<path d="M18 15V10a6 6 0 1 0-12 0v5l-2 3h16z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  clipboard: '<rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/>',
  dot: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/>',
  density: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10.7" x2="20" y2="10.7"/><line x1="4" y1="15.3" x2="20" y2="15.3"/><line x1="4" y1="20" x2="20" y2="20"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'
};
const icon = (n, s = 15) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ICONS.dot}</svg>`;

/* ------------------------------- UTILS ---------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2, 9);
const N = (v) => { const x = parseFloat(v); return Number.isFinite(x) ? x : 0; };
const nowISO = () => new Date().toISOString();
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fxOf = (code) => (S.db.masters.currency.find(c => c.code === code) || {}).rate || 1;
const symOf = (code) => (S.db.masters.currency.find(c => c.code === code) || {}).symbol || "₹";

function fmt(inr, code = "INR", dec = 0) {
  const v = inr / fxOf(code);
  return symOf(code) + " " + v.toLocaleString(code === "INR" ? "en-IN" : "en-US",
    { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtC(inr, code = "INR") {
  const s = symOf(code), v = inr / fxOf(code), a = Math.abs(v), sg = v < 0 ? "-" : "";
  if (code === "INR") {
    if (a >= 1e7) return `${sg}${s} ${(a / 1e7).toFixed(2)} Cr`;
    if (a >= 1e5) return `${sg}${s} ${(a / 1e5).toFixed(2)} L`;
    if (a >= 1e3) return `${sg}${s} ${(a / 1e3).toFixed(1)} K`;
    return `${sg}${s} ${a.toFixed(0)}`;
  }
  if (a >= 1e6) return `${sg}${s} ${(a / 1e6).toFixed(2)} M`;
  if (a >= 1e3) return `${sg}${s} ${(a / 1e3).toFixed(1)} K`;
  return `${sg}${s} ${a.toFixed(0)}`;
}
const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;
const dstr = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
const tstr = (iso) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/* ------------------------------- STATE ---------------------------------- */
const STORE_KEY = "teal:costing:db:v1";
const S = {
  db: null, cfg: null, view: "dashboard", tab: "material", activeId: null,
  role: "Cost Engineer", user: "Jatin Songara", theme: "light", currency: "INR",
  query: "", filterBU: "All", fStatus: "All", masterTab: "process", reportKind: "internal",
  sort: { k: "updatedAt", dir: -1 }, revA: 0, revB: 0, modal: null, notif: false, collapsed: false,
  density: "comfortable", undo: null, pal: null,
  gridQ: {}, gridSort: {}, sel: {}
};

/* Interface preferences persist separately from cost data — never encrypted,
   never exported, purely this browser's view settings. */
const UI_KEY = "teal:costing:ui";
function loadUI() {
  try {
    const u = JSON.parse(localStorage.getItem(UI_KEY) || "{}");
    ["theme", "density", "currency", "role", "collapsed"].forEach(k => { if (u[k] !== undefined) S[k] = u[k]; });
  } catch (e) { }
}
function saveUI() {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({
      theme: S.theme, density: S.density, currency: S.currency, role: S.role, collapsed: S.collapsed
    }));
  } catch (e) { }
}

const CAN = () => S.cfg.roles[S.role] || S.cfg.roles["Viewer"];
const activeProject = () => S.db.projects.find(p => p.id === S.activeId) || null;


/* ================================ VAULT ==================================
   Optional encryption-at-rest. If data/vault.enc is present the application
   will not start without the passphrase, because the project data is real
   AES-256-GCM ciphertext — there is no code path that reads it without the
   key. Working edits in this browser are encrypted with the same key.

   Generate or update the vault with encrypt.html. When you publish a vault,
   delete the plaintext data/*.json from the repository.
   ======================================================================== */

const VAULT_PATH = "data/vault.enc";
const SESSION_KEY = "teal:costing:key";
const KDF_ITER = 310000;
let CRYPTO_KEY = null;     // set only when the vault is in use
let LOCK_TRIES = 0;

function b64(buf) {
  const b = new Uint8Array(buf); let out = "", N = 0x8000;
  for (let i = 0; i < b.length; i += N) out += String.fromCharCode.apply(null, b.subarray(i, i + N));
  return btoa(out);
}
const unb64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function deriveKey(pass, salt, iter) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
async function encryptJSON(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return { iv: b64(iv), ct: b64(ct) };
}
async function decryptJSON(key, iv, ct) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(ct));
  return JSON.parse(new TextDecoder().decode(pt));
}

async function probeVault() {
  try {
    const r = await fetch(VAULT_PATH + "?v=" + Date.now());
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

/* ----------------------------- LOCK SCREEN ------------------------------- */
function lockHTML(err) {
  return `<div class="lock">
    <form class="lock-card" id="lockForm" autocomplete="on">
      <div class="lock-mark">
        <svg viewBox="0 0 24 24" width="30" height="30" style="color:var(--teal)">
          <circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <path d="M12 2.2v19.6M2.2 12h19.6" stroke="currentColor" stroke-width=".9" opacity=".5"/>
          <path d="M12 12 L12 3.4 A8.6 8.6 0 0 1 20.6 12 Z" fill="currentColor" opacity=".92"/></svg>
        <div><b>TEAL</b><small>Costing &amp; Estimation Platform</small></div>
      </div>
      <div class="lock-rule"></div>
      <div class="field" style="margin-bottom:12px">
        <label>Passphrase</label>
        <input class="inp" type="password" id="lockPass" autocomplete="current-password" autofocus
               placeholder="Enter the platform passphrase">
      </div>
      <button class="btn primary" type="submit" style="width:100%;justify-content:center" id="lockBtn">Unlock</button>
      ${err ? `<div class="lock-err">${esc(err)}</div>` : ""}
      <div class="lock-note">Cost data on this site is encrypted. Without the passphrase there is nothing to read.
        Contact the vertical PMO if you need access.</div>
    </form>
  </div>`;
}

function showLock(err) {
  const app = $("#app");
  app.dataset.theme = S.theme || "light";
  app.innerHTML = lockHTML(err);
  const form = $("#lockForm"), pass = $("#lockPass"), btn = $("#lockBtn");
  setTimeout(() => pass && pass.focus(), 40);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = pass.value; if (!v) return;
    btn.disabled = true; btn.textContent = "Deriving key…";
    if (LOCK_TRIES >= 4) await new Promise(r => setTimeout(r, 1200 * (LOCK_TRIES - 3)));
    try {
      const vault = await probeVault();
      const key = await deriveKey(v, unb64(vault.salt), vault.iter || KDF_ITER);
      const bundle = await decryptJSON(key, vault.iv, vault.ct);
      CRYPTO_KEY = key;
      try { sessionStorage.setItem(SESSION_KEY, b64(await crypto.subtle.exportKey("raw", key))); } catch (e2) { }
      await startApp(bundle);
    } catch (e2) {
      LOCK_TRIES++;
      showLock(LOCK_TRIES >= 4 ? "Incorrect passphrase. Further attempts are being slowed down."
        : "Incorrect passphrase.");
    }
  });
}

async function keyFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return await crypto.subtle.importKey("raw", unb64(raw), { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  } catch (e) { return null; }
}

/* --------------------------- JSON DATA LAYER ---------------------------- */
/* data/*.json is the editable backend. localStorage holds working state.   */

async function fetchJSON(path) {
  const r = await fetch(path + "?v=" + Date.now());
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

/* Load the open (unencrypted) baseline — used when no vault is published. */
async function loadOpenBundle() {
  const [config, masters, seed] = await Promise.all([
    fetchJSON("data/config.json"), fetchJSON("data/masters.json"), fetchJSON("data/projects.json")]);
  return { config, masters, projects: seed.projects || [], templates: seed.templates || [], audit: seed.audit || [] };
}

/* Restore this browser's working state, decrypting it when a vault is in use. */
async function loadWorking() {
  const saved = localStorage.getItem(STORE_KEY);
  if (!saved) return null;
  try {
    const raw = JSON.parse(saved);
    const db = raw && raw.ct ? (CRYPTO_KEY ? await decryptJSON(CRYPTO_KEY, raw.iv, raw.ct) : null) : raw;
    return (db && db.projects && db.masters) ? db : null;
  } catch (e) { return null; }
}

let saveTimer = null;
function persist() {
  setSaved(false);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const payload = CRYPTO_KEY ? await encryptJSON(CRYPTO_KEY, S.db) : S.db;
      localStorage.setItem(STORE_KEY, JSON.stringify(payload));
      setSaved(true);
    } catch (e) { setSaved(true); toast("Could not save locally — export your data."); }
  }, 600);
}
function setSaved(ok) {
  const d = $("#saveDot"), t = $("#saveTxt");
  if (d) d.style.background = ok ? "var(--green)" : "var(--amber)";
  if (t) t.textContent = ok ? "All changes saved" : "Saving…";
}
function resetToJSON() {
  localStorage.removeItem(STORE_KEY);
  location.reload();
}
function downloadFile(name, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportMastersJSON() { downloadFile("masters.json", JSON.stringify(S.db.masters, null, 2)); }
function exportProjectsJSON() {
  downloadFile("projects.json", JSON.stringify(
    { projects: S.db.projects, templates: S.db.templates, audit: S.db.audit }, null, 2));
}
function log(entity, field, prev, next) {
  S.db.audit.unshift({ id: uid(), ts: nowISO(), user: S.user, role: S.role, entity, field, prev: String(prev ?? ""), next: String(next ?? "") });
  S.db.audit = S.db.audit.slice(0, 400);
  persist();
}

/* --------------------------- MODULE DEFINITIONS -------------------------- */
const TYPE_MECH = ["Fabrication", "Machining", "Sheet Metal", "Standard Parts", "Motion Components", "Bearings & Guides", "Fasteners", "Pneumatics", "Hydraulics", "Surface Treatment", "Assembly Hardware", "Inspection Tooling"];
const TYPE_ELEC = ["PLC", "HMI", "Servo Motor", "Servo Drive", "VFD", "Sensors", "Vision Camera", "Lighting", "Cables & Glands", "Panel & Enclosure", "Safety Components", "Wiring Accessories", "Test Instruments"];
const ACT_SW = ["PLC Programming", "HMI Development", "Robot Programming", "Vision Programming", "SCADA / MES Interface", "Application Software", "Software Documentation", "FAT Software Validation"];
const ACT_LAB = ["Mechanical Assembly", "Electrical Assembly", "In-process Inspection", "Functional Testing", "Packing", "Installation", "Commissioning", "Operator Training", "As-built Documentation"];
const HEAD_SITE = ["Engineer Deployment", "Air / Rail Travel", "Accommodation", "Food & Per Diem", "Local Transport", "Equipment Rental", "Consumables at Site", "Site Facilities"];
const HEAD_COMM = ["Outward Freight", "Transit Insurance", "Export Packaging", "Special Tooling", "Certification (CE/UL)", "Warranty Provision", "Third-Party Services", "Finance / LC Charges", "Miscellaneous"];
const HEAD_AMC = ["Preventive Maintenance Labour", "Spare Parts Kit", "Travel & Lodging", "Consumables", "Remote Support", "Calibration"];
const MAT_CLASS = ["Raw Material", "Standard Component", "Bought-Out Assembly", "Import Item", "Consumable"];

const MODULES = [
  {
    key: "material", label: "Material", short: "MAT", icon: "package",
    note: "BOM-driven. Landed cost = basic + freight + duty + landing charges. GST is recorded for cash-flow only and excluded from cost.",
    cols: [
      { k: "code", l: "Stock code", t: "item", w: "148px" },
      { k: "item", l: "Item / Sub-assembly", t: "text", w: "2fr" },
      { k: "cls", l: "Class", t: "select", opts: MAT_CLASS, w: "150px" },
      { k: "vendor", l: "Vendor", t: "master", m: "vendor", w: "170px" },
      { k: "qty", l: "Qty", t: "num", w: "70px" },
      { k: "uom", l: "UOM", t: "text", w: "60px" },
      { k: "price", l: "Unit Price", t: "num", w: "100px" },
      { k: "cur", l: "Cur", t: "select", opts: ["INR", "USD", "EUR", "JPY"], w: "70px" }
    ],
    calc: (r) => N(r.qty) * N(r.price) * fxOf(r.cur || "INR"),
    blank: () => ({ id: uid(), code: "", item: "", spec: "", cls: "Standard Component", vendor: "", qty: 1, uom: "no", price: 0, cur: "INR" })
  },
  {
    key: "mechanical", label: "Mechanical", short: "MEC", icon: "wrench",
    note: "Mechanical scope not covered by the BOM — fabrication, treatment, motion hardware and assembly consumables.",
    cols: [
      { k: "item", l: "Description", t: "text", w: "2fr" },
      { k: "type", l: "Type", t: "select", opts: TYPE_MECH, w: "170px" },
      { k: "vendor", l: "Vendor", t: "master", m: "vendor", w: "170px" },
      { k: "qty", l: "Qty", t: "num", w: "70px" },
      { k: "rate", l: "Rate", t: "num", w: "100px" }
    ],
    calc: (r) => N(r.qty) * N(r.rate),
    blank: () => ({ id: uid(), item: "", type: "Fabrication", vendor: "", qty: 1, rate: 0 })
  },
  {
    key: "electrical", label: "Electrical", short: "ELE", icon: "cpu",
    note: "Control hardware, field devices, panels and wiring material.",
    cols: [
      { k: "item", l: "Description", t: "text", w: "2fr" },
      { k: "type", l: "Type", t: "select", opts: TYPE_ELEC, w: "160px" },
      { k: "make", l: "Make", t: "master", m: "vendor", w: "160px" },
      { k: "qty", l: "Qty", t: "num", w: "70px" },
      { k: "rate", l: "Unit Price", t: "num", w: "100px" }
    ],
    calc: (r) => N(r.qty) * N(r.rate),
    blank: () => ({ id: uid(), item: "", type: "Sensors", make: "", qty: 1, rate: 0 })
  },
  {
    key: "software", label: "Software & Controls", short: "S/W", icon: "code",
    note: "Engineering effort for control logic, vision, robotics and software validation. Rates pull from the Engineering Rate master.",
    cols: [
      { k: "item", l: "Activity", t: "select", opts: ACT_SW, w: "2fr" },
      { k: "res", l: "Resource", t: "master", m: "engineering", w: "190px", fill: { from: "rate", to: "rate" } },
      { k: "md", l: "Mandays", t: "num", w: "90px" },
      { k: "rate", l: "Rate / Manday", t: "num", w: "120px" }
    ],
    calc: (r) => N(r.md) * N(r.rate),
    blank: () => ({ id: uid(), item: "PLC Programming", res: "Controls Engineering", md: 0, rate: 6200 })
  },
  {
    key: "manufacturing", label: "Manufacturing", short: "MFG", icon: "factory",
    note: "Machine-hour costing. Cost = (Run hours + Setup hours) × Machine hour rate. Rates pull from the Process Rate master.",
    cols: [
      { k: "proc", l: "Process", t: "master", m: "process", w: "2fr", fill: { from: "rate", to: "rate" }, fill2: { from: "dept", to: "dept" } },
      { k: "dept", l: "Dept", t: "text", w: "130px", ro: true },
      { k: "part", l: "Part / Reference", t: "text", w: "160px" },
      { k: "setup", l: "Setup Hr", t: "num", w: "85px" },
      { k: "hrs", l: "Run Hr", t: "num", w: "85px" },
      { k: "rate", l: "Rate / Hr", t: "num", w: "100px" }
    ],
    calc: (r) => (N(r.setup) + N(r.hrs)) * N(r.rate),
    blank: () => ({ id: uid(), proc: "CNC Milling (VMC)", dept: "Machining", part: "", setup: 0, hrs: 0, rate: 1250 })
  },
  {
    key: "labour", label: "Labour", short: "LAB", icon: "users",
    note: "Direct shop-floor and field labour. Cost = (Mandays × Rate) + (OT hours × OT rate).",
    cols: [
      { k: "item", l: "Activity", t: "select", opts: ACT_LAB, w: "2fr" },
      { k: "cat", l: "Category", t: "master", m: "labour", w: "200px", fill: { from: "rate", to: "rate" }, fill2: { from: "ot", to: "otr" } },
      { k: "md", l: "Mandays", t: "num", w: "85px" },
      { k: "rate", l: "Rate / Day", t: "num", w: "100px" },
      { k: "ot", l: "OT Hr", t: "num", w: "75px" },
      { k: "otr", l: "OT Rate", t: "num", w: "90px" }
    ],
    calc: (r) => N(r.md) * N(r.rate) + N(r.ot) * N(r.otr),
    blank: () => ({ id: uid(), item: "Mechanical Assembly", cat: "Mechanical Assembly Technician", md: 0, rate: 2400, ot: 0, otr: 450 })
  },
  {
    key: "design", label: "Design & Engineering", short: "DES", icon: "ruler",
    note: "Engineering effort in mandays plus any non-recurring engineering (NRE) recovered on this order.",
    cols: [
      { k: "disc", l: "Discipline", t: "master", m: "engineering", w: "2fr", fill: { from: "rate", to: "rate" } },
      { k: "scope", l: "Scope Note", t: "text", w: "1.4fr" },
      { k: "md", l: "Mandays", t: "num", w: "90px" },
      { k: "rate", l: "Rate / Day", t: "num", w: "105px" },
      { k: "nre", l: "NRE", t: "num", w: "100px" }
    ],
    calc: (r) => N(r.md) * N(r.rate) + N(r.nre),
    blank: () => ({ id: uid(), disc: "Mechanical Design", scope: "", md: 0, rate: 5200, nre: 0 })
  },
  {
    key: "site", label: "Site & Installation", short: "SITE", icon: "truck",
    note: "Deployment cost at customer site. Cost = Persons × Days × Rate. Site contingency is applied on the module total.",
    cols: [
      { k: "head", l: "Head", t: "select", opts: HEAD_SITE, w: "2fr" },
      { k: "loc", l: "Location", t: "text", w: "150px" },
      { k: "pax", l: "Persons", t: "num", w: "85px" },
      { k: "days", l: "Days", t: "num", w: "75px" },
      { k: "rate", l: "Rate / Unit", t: "num", w: "110px" }
    ],
    calc: (r) => Math.max(1, N(r.pax)) * Math.max(1, N(r.days)) * N(r.rate),
    blank: () => ({ id: uid(), head: "Engineer Deployment", loc: "", pax: 1, days: 1, rate: 0 })
  },
  {
    key: "commercial", label: "Commercial", short: "COM", icon: "receipt",
    note: "Order-level commercial heads. A percentage basis is applied to the sum of all preceding direct cost modules.",
    cols: [
      { k: "head", l: "Head", t: "select", opts: HEAD_COMM, w: "2fr" },
      { k: "basis", l: "Basis", t: "select", opts: ["Lump sum", "% of direct cost"], w: "170px" },
      { k: "val", l: "Value", t: "num", w: "120px" }
    ],
    calc: (r, ctx) => r.basis === "% of direct cost" ? (ctx && ctx.directBase || 0) * N(r.val) / 100 : N(r.val),
    blank: () => ({ id: uid(), head: "Outward Freight", basis: "Lump sum", val: 0 })
  },
  {
    key: "amc", label: "AMC", short: "AMC", icon: "lifebuoy",
    note: "Post-warranty service contract, quoted separately from equipment. Multi-year cost compounds at the escalation rate.",
    cols: [
      { k: "head", l: "Head", t: "select", opts: HEAD_AMC, w: "2fr" },
      { k: "tier", l: "Tier", t: "select", opts: ["Basic", "Standard", "Premium"], w: "120px" },
      { k: "visits", l: "Visits / Yr", t: "num", w: "100px" },
      { k: "rate", l: "Cost / Visit", t: "num", w: "115px" },
      { k: "esc", l: "Escalation %", t: "num", w: "115px" },
      { k: "yrs", l: "Years", t: "num", w: "80px" }
    ],
    calc: (r) => {
      const base = N(r.visits) * N(r.rate), e = N(r.esc) / 100, y = Math.max(1, Math.round(N(r.yrs) || 1));
      let t = 0; for (let i = 0; i < y; i++) t += base * Math.pow(1 + e, i); return t;
    },
    blank: () => ({ id: uid(), head: "Preventive Maintenance Labour", tier: "Standard", visits: 4, rate: 0, esc: 6, yrs: 3 })
  }
];
const MOD_MAP = Object.fromEntries(MODULES.map(m => [m.key, m]));
const EQUIP_KEYS = ["material", "mechanical", "electrical", "software", "manufacturing", "labour", "design", "site", "commercial"];
const BUCKET_COLOR = {
  material: "#0B6E75", mechanical: "#12838C", electrical: "#2AA0A8", software: "#4FBAC1",
  manufacturing: "#7A6FB0", labour: "#B8800C", design: "#C46A3F", site: "#8A9BA5",
  commercial: "#5B7080", amc: "#1B7F5A"
};

/* ============================= ITEM MASTER ===============================
   One catalogue of TEAL stock codes with price, specification, vendor, UOM
   and lead time. Projects reference a code; the price and specification come
   from here, so a rate revision is made once and every new estimate uses it.
   ======================================================================== */

const STALE_DAYS = 180;
const ITEMS = () => S.db.masters.item || [];
const itemByCode = (code) => {
  const c = String(code || "").trim().toLowerCase();
  return c ? ITEMS().find(i => String(i.code).toLowerCase() === c) : null;
};
const priceAge = (it) => (it && it.updated) ? Math.floor((Date.now() - new Date(it.updated).getTime()) / 864e5) : null;
const isStale = (it) => { const a = priceAge(it); return a != null && a > STALE_DAYS; };

/* Pull a catalogue record onto a BOM line. Quantity is never touched. */
function applyItem(row, it) {
  row.code = it.code;
  row.item = it.name;
  row.spec = it.spec || "";
  row.cls = it.cls || row.cls;
  row.vendor = it.vendor || row.vendor;
  row.uom = it.uom || row.uom;
  row.price = it.price;
  row.cur = it.cur || "INR";
  return row;
}
function nextItemCode(group) {
  const g = (group || "GEN").toUpperCase();
  const n = ITEMS().filter(i => String(i.code).startsWith("TL-" + g + "-")).length + 1;
  return `TL-${g}-${String(n * 10).padStart(4, "0")}`;
}
/* Which projects consume a code — the impact list before changing a price. */
function whereUsed(code) {
  const out = [];
  S.db.projects.forEach(p => {
    const n = (p.lines.material || []).filter(r => String(r.code || "").toLowerCase() === String(code).toLowerCase()).length;
    if (n) out.push({ code: p.code, name: p.name, n });
  });
  return out;
}
/* Catalogue discipline on one project's BOM. */
function catalogueHealth(c) {
  const rows = c.lines.material || [];
  const linked = rows.filter(r => itemByCode(r.code));
  const off = rows.filter(r => !itemByCode(r.code));
  const drift = linked.filter(r => {
    const it = itemByCode(r.code);
    return Math.abs(N(r.price) - N(it.price)) > 0.005 * Math.max(N(it.price), 1) || (r.cur || "INR") !== (it.cur || "INR");
  });
  const stale = linked.filter(r => isStale(itemByCode(r.code)));
  const val = rows.reduce((s, r) => s + r._amt, 0) || 1;
  const linkedVal = linked.reduce((s, r) => s + r._amt, 0);
  return { rows, linked, off, drift, stale, coverage: rows.length ? linked.length / rows.length : 0, valueCoverage: linkedVal / val };
}

/* -------------------------- CALCULATION ENGINE --------------------------- */
function computeProject(p) {
  const lines = {}, buckets = {};
  for (const m of MODULES) {
    if (m.key === "commercial") continue;
    const rows = (p.lines[m.key] || []).map(r => Object.assign({}, r, { _amt: m.calc(r) }));
    lines[m.key] = rows;
    buckets[m.key] = rows.reduce((s, r) => s + r._amt, 0);
  }
  const basic = buckets.material;
  const freight = basic * N(p.landed.freightPct) / 100;
  const duty = basic * N(p.landed.dutyPct) / 100;
  const landing = basic * N(p.landed.landingPct) / 100;
  const gst = (basic + freight + duty + landing) * N(p.landed.gstPct) / 100;
  buckets.material = basic + freight + duty + landing;

  const siteBase = buckets.site;
  buckets.site = siteBase * (1 + N(p.landed.siteContPct) / 100);

  const directBase = EQUIP_KEYS.filter(k => k !== "commercial").reduce((s, k) => s + buckets[k], 0);
  const cRows = (p.lines.commercial || []).map(r => Object.assign({}, r, { _amt: MOD_MAP.commercial.calc(r, { directBase }) }));
  lines.commercial = cRows;
  buckets.commercial = cRows.reduce((s, r) => s + r._amt, 0);

  const qty = Math.max(1, N(p.qty) || 1);
  const direct = EQUIP_KEYS.reduce((s, k) => s + buckets[k], 0);
  const overheads = direct * N(p.markup.overheadPct) / 100;
  const contingency = (direct + overheads) * N(p.markup.contingencyPct) / 100;
  const totalCost = direct + overheads + contingency;
  const profit = totalCost * N(p.markup.profitPct) / 100;
  const selling = totalCost + profit;
  const amc = buckets.amc;

  return {
    lines, buckets, basic, freight, duty, landing, gst, siteBase,
    direct, overheads, contingency, totalCost, profit, selling, amc, qty,
    orderValue: selling * qty, perUnit: selling,
    grossMargin: selling ? (selling - direct) / selling : 0,
    netMargin: selling ? profit / selling : 0,
    contractValue: selling * qty + amc
  };
}
let CALCS = {};
function recalcAll() {
  CALCS = {};
  S.db.projects.forEach(p => { CALCS[p.id] = computeProject(p); });
}
const activeCalc = () => S.activeId ? CALCS[S.activeId] : null;

function approvalFloor(orderValueINR) {
  const a = (S.db.masters.approval && S.db.masters.approval.length) ? S.db.masters.approval : [{ band: "—", approver: "—", minMargin: 20 }];
  const i = orderValueINR <= 2500000 ? 0 : orderValueINR <= 10000000 ? 1 : orderValueINR <= 50000000 ? 2 : 3;
  return a[Math.min(i, a.length - 1)];
}

/* ------------------------------ CHARTS ---------------------------------- */
function donut(data, size = 168, thickness = 28) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2, C = 2 * Math.PI * r, c = size / 2;
  let off = 0;
  const segs = data.map(d => {
    const len = (d.value / total) * C;
    const el = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${thickness}"
      stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 ${c} ${c})"><title>${esc(d.name)}</title></circle>`;
    off += len; return el;
  }).join("");
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block">${segs}</svg>`;
}

function lineChart(values, labels, fmtY) {
  const W = 520, H = 190, pad = { l: 46, r: 10, t: 12, b: 24 };
  const max = Math.max(...values, 1) * 1.12;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const x = (i) => pad.l + (values.length > 1 ? (i / (values.length - 1)) * iw : iw / 2);
  const y = (v) => pad.t + ih - (v / max) * ih;
  const grid = [0, .25, .5, .75, 1].map(f => {
    const gy = pad.t + ih - f * ih;
    return `<line x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}" stroke="var(--line-2)" stroke-width="1"/>
      <text x="${pad.l - 7}" y="${gy + 3.5}" text-anchor="end" font-size="9.5" fill="var(--ink-3)" font-family="var(--mono)">${fmtY(max * f)}</text>`;
  }).join("");
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const dots = values.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="var(--teal)"><title>${fmtY(v)}</title></circle>`).join("");
  const xl = labels.map((l, i) => `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="var(--ink-3)">${esc(l)}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="208" preserveAspectRatio="none" style="display:block">
    ${grid}<polyline points="${pts}" fill="none" stroke="var(--teal)" stroke-width="2" stroke-linejoin="round"/>${dots}${xl}</svg>`;
}

function hbars(rows, cur) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return rows.map(r => `
    <div style="margin-bottom:9px" class="${r.act ? "clicky" : ""}" ${r.act ? `data-act="${r.act}" data-bu="${esc(r.name)}"` : ""}>
      <div class="spread" style="margin-bottom:3px">
        <span style="font-size:12">${esc(r.name)}</span>
        <span class="mono" style="font-size:11.5">${fmtC(r.value, cur)}${r.sub ? " · " + r.sub : ""}</span>
      </div>
      <div class="kpi-bar"><i style="width:${(r.value / max * 100).toFixed(1)}%;background:${r.color || "var(--teal)"}"></i></div>
    </div>`).join("");
}

function vbars(rows, cur) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return `<div style="display:flex;align-items:flex-end;gap:8px;height:190px;padding-top:6px">
    ${rows.map(r => `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end" title="${esc(r.name)} — ${fmtC(r.value, cur)}">
        <span class="mono" style="font-size:9.5px;color:var(--ink-3)">${fmtC(r.value, cur)}</span>
        <div style="width:100%;background:${r.color};border-radius:2px 2px 0 0;height:${(r.value / max * 100).toFixed(1)}%;min-height:2px;transition:height .4s cubic-bezier(.4,0,.2,1)"></div>
        <span class="eyebrow" style="font-size:9px">${esc(r.short)}</span>
      </div>`).join("")}
  </div>`;
}

/* --------------------------- HTML HELPERS -------------------------------- */
const tb = (cells) => `
  <div class="titleblock fadein" style="grid-template-columns:${cells.map(c => c.w || "1fr").join(" ")}">
    ${cells.map(c => `<div class="tb-cell${c.wide ? " wide" : ""}">
      <span class="eyebrow">${esc(c.l)}</span>
      <div class="tb-val" title="${esc(c.v)}"${c.color ? ` style="color:${c.color}"` : ""}${c.live ? ` data-live="sum" data-f="${c.live}"` : ""}>${esc(c.v)}</div>
    </div>`).join("")}
  </div>`;

const card = (o) => `
  <div class="card"${o.style ? ` style="${o.style}"` : ""}>
    ${(o.title || o.right) ? `<div class="card-head"><h3>${esc(o.title || "")}</h3><div class="row">${o.right || ""}</div></div>` : ""}
    ${o.pad === false ? o.body : `<div class="card-body">${o.body}</div>`}
  </div>`;

const kpi = (o) => `
  <div class="kpi">
    <span class="eyebrow">${esc(o.label)}</span>
    <div class="kpi-val"${o.color ? ` style="color:${o.color}"` : ""}>${esc(o.value)}</div>
    ${o.sub ? `<div class="kpi-sub">${esc(o.sub)}</div>` : ""}
    ${o.share != null ? `<div class="kpi-bar"><i style="width:${Math.min(100, o.share * 100).toFixed(1)}%;background:${o.color || "var(--teal)"}"></i></div>` : ""}
  </div>`;

const STATUS_STYLE = {
  "Draft": "", "Submitted": "amber", "Under Review": "amber", "Approved": "green",
  "Quoted": "teal", "Won": "green", "Lost": "red", "Returned": "red"
};
const statusChip = (s) => `<span class="chip ${STATUS_STYLE[s] || ""}">${esc(s)}</span>`;
/* Colour alone should never carry the verdict. */
function marginCell(c) {
  const f = approvalFloor(c.orderValue), ok = c.netMargin * 100 >= f.minMargin;
  return `<span class="calc" style="color:${ok ? "var(--green)" : "var(--signal)"}" title="${ok ? "Clears" : "Below"} the ${f.minMargin}% floor">
    <span class="mk">${ok ? "✓" : "!"}</span>${pct(c.netMargin, 1)}</span>`;
}
const emptyBox = (ic, h, p, action) => `<div class="empty">${icon(ic, 22)}<h4>${esc(h)}</h4><p>${p}</p>${action || ""}</div>`;
const opts = (list, sel) => list.map(o => `<option${String(o) === String(sel) ? " selected" : ""}>${esc(o)}</option>`).join("");
/* A stored value that is no longer in the master list must still show, or the
   select silently misreports what the record actually holds. */
const optsWith = (list, sel) => opts(
  (sel != null && sel !== "" && !list.some(o => String(o) === String(sel))) ? [sel].concat(list) : list, sel);

/* ------------------------------ DASHBOARD -------------------------------- */
function viewDashboard() {
  const cur = S.currency;
  const list = S.filterBU === "All" ? S.db.projects : S.db.projects.filter(p => p.bu === S.filterBU);
  const agg = { order: 0, cost: 0, profit: 0, direct: 0, amc: 0, b: {} };
  list.forEach(p => {
    const c = CALCS[p.id]; if (!c) return;
    agg.order += c.orderValue; agg.cost += c.totalCost * c.qty; agg.profit += c.profit * c.qty;
    agg.direct += c.direct * c.qty; agg.amc += c.amc;
    EQUIP_KEYS.forEach(k => agg.b[k] = (agg.b[k] || 0) + c.buckets[k] * c.qty);
  });
  const pending = list.filter(p => ["Submitted", "Under Review"].includes(p.status));
  const active = list.filter(p => !["Lost", "Won"].includes(p.status));
  const gm = agg.order ? (agg.order - agg.direct) / agg.order : 0;
  const nm = agg.order ? agg.profit / agg.order : 0;

  const dData = EQUIP_KEYS.map(k => ({ name: MOD_MAP[k].label, value: Math.round(agg.b[k] || 0), color: BUCKET_COLOR[k], key: k }))
    .filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const buAgg = {};
  list.forEach(p => {
    const c = CALCS[p.id]; if (!c) return;
    buAgg[p.bu] = buAgg[p.bu] || { name: p.bu, value: 0, n: 0 };
    buAgg[p.bu].value += c.orderValue; buAgg[p.bu].n++;
  });
  const buRows = Object.values(buAgg).sort((a, b) => b.value - a.value)
    .map(r => ({
      name: r.name, value: r.value, sub: `${r.n} project${r.n > 1 ? "s" : ""}`,
      act: "filterBUClick", color: S.filterBU === r.name ? "var(--signal)" : "var(--teal)"
    }));

  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const trend = months.map((m, i) =>
    list.filter(p => new Date(p.createdAt).getMonth() === i + 1)
      .reduce((s, p) => s + (CALCS[p.id] ? CALCS[p.id].orderValue : 0), 0));

  const legend = dData.map(d => `
    <div class="spread" style="padding:3.5px 0;border-bottom:1px solid var(--line-2)">
      <div class="row" style="gap:7px;min-width:0">
        <i style="width:8px;height:8px;border-radius:1px;background:${d.color};flex:0 0 8px"></i>
        <span style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(d.name)}</span>
      </div>
      <div class="row" style="gap:9px">
        <span class="mono" style="font-size:11.5px;color:var(--ink-3)">${pct(d.value / (agg.cost || 1), 0)}</span>
        <span class="mono" style="font-size:11.5px;min-width:72px;text-align:right">${fmtC(d.value, cur)}</span>
      </div>
    </div>`).join("");

  const queue = pending.length ? `
    <table class="tbl"><thead><tr><th>Project</th><th>Margin</th><th class="num">Order value</th><th></th></tr></thead><tbody>
    ${pending.map(p => {
    const c = CALCS[p.id], f = approvalFloor(c.orderValue), short = c.netMargin * 100 < f.minMargin;
    return `<tr>
        <td><div class="cell"><div style="font-weight:500">${esc(p.code)}</div>
          <div style="font-size:11px;color:var(--ink-3)">${esc(p.name.slice(0, 40))}</div></div></td>
        <td><div class="cell"><span class="chip ${short ? "red" : "green"}">${pct(c.netMargin, 1)}</span>
          <div style="font-size:10.5px;color:var(--ink-3);margin-top:3px">Floor ${f.minMargin}% · ${esc(f.approver)}</div></div></td>
        <td class="num"><span class="calc">${fmtC(c.orderValue, cur)}</span></td>
        <td><div class="cell"><button class="btn sm" data-act="open" data-id="${p.id}">Open ${icon("right", 11)}</button></div></td>
      </tr>`;
  }).join("")}</tbody></table>`
    : emptyBox("check", "Queue clear", "Nothing is waiting on a decision.");

  const recent = [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(p => {
    const c = CALCS[p.id];
    return `<tr data-act="open" data-id="${p.id}" style="cursor:pointer">
      <td><span class="calc mono" style="text-align:left;font-size:11.5px">${esc(p.code)}</span></td>
      <td><div class="cell" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</div></td>
      <td><div class="cell">${esc(p.customer)}</div></td>
      <td><div class="cell" style="color:var(--ink-2)">${esc(p.bu)}</div></td>
      <td><div class="cell"><span class="chip">${esc(p.rev)}</span></div></td>
      <td><div class="cell">${statusChip(p.status)}</div></td>
      <td class="num"><span class="calc">${fmtC(c.totalCost * c.qty, cur)}</span></td>
      <td class="num"><span class="calc">${fmtC(c.orderValue, cur)}</span></td>
      <td class="num">${marginCell(c)}</td>
      <td><div class="cell" style="color:var(--ink-3)">${icon("right", 13)}</div></td>
    </tr>`;
  }).join("");

  return `
  ${tb([
    { l: "Sheet", v: "Executive Cost Dashboard", w: "1.6fr", wide: true },
    { l: "Portfolio", v: S.filterBU, w: "1.3fr" },
    { l: "Projects", v: `${list.length} live` },
    { l: "Reporting Currency", v: cur },
    { l: "As Of", v: dstr(nowISO()) }
  ])}

  <div class="kpi-strip" style="margin-bottom:12px">
    ${kpi({ label: "Order Value", value: fmtC(agg.order, cur), sub: `${active.length} active projects` })}
    ${kpi({ label: "Total Cost", value: fmtC(agg.cost, cur), sub: "Incl. overhead & contingency", share: agg.order ? agg.cost / agg.order : 0, color: "var(--ink-2)" })}
    ${kpi({ label: "Gross Margin", value: pct(gm), sub: "On direct cost", share: gm, color: gm < .22 ? "var(--signal)" : "var(--green)" })}
    ${kpi({ label: "Net Margin", value: pct(nm), sub: "After overhead recovery", share: nm, color: nm < .15 ? "var(--signal)" : "var(--green)" })}
    ${kpi({ label: "Material", value: fmtC(agg.b.material || 0, cur), share: agg.cost ? (agg.b.material || 0) / agg.cost : 0, color: BUCKET_COLOR.material })}
    ${kpi({ label: "Manufacturing", value: fmtC(agg.b.manufacturing || 0, cur), share: agg.cost ? (agg.b.manufacturing || 0) / agg.cost : 0, color: BUCKET_COLOR.manufacturing })}
    ${kpi({ label: "Labour", value: fmtC(agg.b.labour || 0, cur), share: agg.cost ? (agg.b.labour || 0) / agg.cost : 0, color: BUCKET_COLOR.labour })}
    ${kpi({ label: "Design", value: fmtC(agg.b.design || 0, cur), share: agg.cost ? (agg.b.design || 0) / agg.cost : 0, color: BUCKET_COLOR.design })}
    ${kpi({ label: "AMC Pipeline", value: fmtC(agg.amc, cur), sub: "Multi-year contracted", color: BUCKET_COLOR.amc })}
    ${kpi({ label: "Pending Approval", value: String(pending.length), sub: pending.length ? pending[0].code : "Queue clear", color: pending.length ? "var(--amber)" : "var(--ink-2)" })}
  </div>

  <div class="grid" style="grid-template-columns:1.05fr 1fr;margin-bottom:12px">
    ${card({
    title: "Portfolio Cost Structure", right: `<span class="eyebrow">${dData.length} heads</span>`,
    body: `<div style="display:flex;gap:14px;align-items:center">
        <div style="flex:0 0 168px">${donut(dData)}</div>
        <div style="flex:1;min-width:0">${legend}</div></div>`
  })}
    ${card({
    title: "Quotation Value by Month", right: `<span class="eyebrow">FY 26–27</span>`,
    body: lineChart(trend, months, (v) => S.currency === "INR" ? (v / fxOf(cur) / 1e7).toFixed(1) + "Cr" : (v / fxOf(cur) / 1e6).toFixed(1) + "M")
  })}
  </div>

  <div class="grid" style="grid-template-columns:1fr 1fr;margin-bottom:12px">
    ${card({
    title: "Business Unit Summary",
    right: `<select class="inp" style="width:168px;padding:3px 6px;font-size:11.5px" data-act="filterBU">
        <option${S.filterBU === "All" ? " selected" : ""}>All</option>${opts(S.cfg.businessUnits, S.filterBU)}</select>`,
    body: buRows.length ? hbars(buRows, cur) : emptyBox("filter", "No projects", "Nothing matches this filter.")
  })}
    ${card({ title: "Approval Queue", right: `<span class="chip amber">${pending.length} waiting</span>`, pad: false, body: queue })}
  </div>

  ${card({
    title: "Recently Updated", right: `<span class="eyebrow">${list.length} projects</span>`, pad: false,
    body: `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Code</th><th>Project</th><th>Customer</th><th>Business unit</th><th>Rev</th><th>Status</th>
      <th class="num">Total cost</th><th class="num">Order value</th><th class="num">Net margin</th><th></th></tr></thead>
      <tbody>${recent}</tbody></table></div>`
  })}`;
}

/* --------------------------- PROJECT REGISTER ---------------------------- */
function viewProjects() {
  const cur = S.currency;
  const rows = S.db.projects
    .filter(p => S.filterBU === "All" || p.bu === S.filterBU)
    .filter(p => S.fStatus === "All" || p.status === S.fStatus)
    .filter(p => !S.query || (p.name + p.code + p.customer + p.machine).toLowerCase().includes(S.query.toLowerCase()))
    .map(p => ({ p, c: CALCS[p.id] }))
    .sort((a, b) => {
      const g = (x) => S.sort.k === "value" ? x.c.orderValue : S.sort.k === "margin" ? x.c.netMargin
        : S.sort.k === "updatedAt" ? new Date(x.p.updatedAt).getTime() : String(x.p[S.sort.k] || "").toLowerCase();
      const A = g(a), B = g(b); return A < B ? -S.sort.dir : A > B ? S.sort.dir : 0;
    });

  const H = (k, l, num) => `<th class="${num ? "num" : ""}" data-act="sort" data-k="${k}" style="cursor:pointer">
    <span style="display:inline-flex;align-items:center;gap:4px">${l}
    <span style="opacity:${S.sort.k === k ? .9 : .25}">${icon("sort", 9)}</span></span></th>`;

  const body = rows.length ? rows.map(({ p, c }) => `
    <tr>
      <td data-act="open" data-id="${p.id}" style="cursor:pointer"><span class="calc mono" style="text-align:left;font-size:11.5px;color:var(--teal)">${esc(p.code)}</span></td>
      <td data-act="open" data-id="${p.id}" style="cursor:pointer"><div class="cell" style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500">${esc(p.name)}</div></td>
      <td><div class="cell">${esc(p.customer)}</div></td>
      <td><div class="cell" style="color:var(--ink-2);font-size:12px">${esc(p.bu)}</div></td>
      <td><div class="cell" style="color:var(--ink-2);font-size:12px">${esc(p.machine)}</div></td>
      <td class="num"><span class="calc">${esc(p.qty)}</span></td>
      <td><div class="cell"><span class="chip">${esc(p.rev)}</span></div></td>
      <td><div class="cell">${statusChip(p.status)}</div></td>
      <td class="num"><span class="calc">${fmtC(c.orderValue, cur)}</span></td>
      <td class="num">${marginCell(c)}</td>
      <td><div class="cell" style="font-size:11.5px;color:var(--ink-3)">${dstr(p.updatedAt)}</div></td>
      <td class="no-print"><div class="cell row rowbtn" style="gap:2px">
        <button class="icon-btn" style="width:24px;height:24px" title="Duplicate" data-act="dup" data-id="${p.id}">${icon("copy", 12)}</button>
        ${CAN().admin ? `<button class="icon-btn" style="width:24px;height:24px" title="Delete" data-act="del" data-id="${p.id}">${icon("trash", 12)}</button>` : ""}
      </div></td>
    </tr>`).join("")
    : `<tr><td colspan="12">${S.db.projects.length === 0
      ? emptyBox("folder", "No projects yet",
        "Start from a blank sheet, or pick a structure that already works and adapt it.",
        `<div class="row" style="justify-content:center">
          <button class="btn primary" data-act="newProject">${icon("plus", 13)} New project</button>
          <button class="btn" data-act="nav" data-k="templates">${icon("clipboard", 13)} Browse templates</button>
          <button class="btn" data-act="nav" data-k="guide">${icon("file", 13)} How to use this</button></div>`)
      : emptyBox("filter", "Nothing matches", "Clear the filters or search for a different project.")}</td></tr>`;

  return `
  ${tb([
    { l: "Sheet", v: "Project & Quotation Register", w: "1.7fr", wide: true },
    { l: "Records", v: `${rows.length} of ${S.db.projects.length}`, w: ".8fr" },
    { l: "Filter", v: S.filterBU === "All" && S.fStatus === "All" ? "None applied" : `${S.filterBU} · ${S.fStatus}`, w: "1.2fr" },
    { l: "Currency", v: cur, w: ".7fr" }
  ])}
  ${card({
    title: "Register", pad: false,
    right: `<select class="inp" style="width:160px;padding:3px 6px;font-size:11.5px" data-act="filterBU">
        <option${S.filterBU === "All" ? " selected" : ""}>All</option>${opts(S.cfg.businessUnits, S.filterBU)}</select>
      <select class="inp" style="width:128px;padding:3px 6px;font-size:11.5px" data-act="filterStatus">
        <option${S.fStatus === "All" ? " selected" : ""}>All</option>${opts(S.cfg.statuses, S.fStatus)}</select>
      <button class="btn primary" data-act="newProject">${icon("plus", 13)} New project</button>`,
    body: `<div class="tbl-wrap"><table class="tbl"><thead><tr>
      ${H("code", "Code")}${H("name", "Project")}${H("customer", "Customer")}${H("bu", "Business unit")}
      <th>Machine</th><th class="num">Qty</th><th>Rev</th>${H("status", "Status")}
      ${H("value", "Order value", true)}${H("margin", "Net margin", true)}${H("updatedAt", "Updated")}<th class="no-print"></th>
      </tr></thead><tbody>${body}</tbody></table></div>`
  })}`;
}

/* ------------------------- LIVE VALUE RESOLVERS -------------------------- */
const bandVal = (c, k) => k === "oh" ? c.overheads : k === "cont" ? c.contingency : k === "profit" ? c.profit : c.buckets[k];

const SUMF = {
  direct: (c, p) => fmt(c.direct, p.currency),
  overheads: (c, p) => fmt(c.overheads, p.currency),
  contingency: (c, p) => fmt(c.contingency, p.currency),
  totalCost: (c, p) => fmt(c.totalCost, p.currency),
  profit: (c, p) => fmt(c.profit, p.currency),
  selling: (c, p) => fmt(c.selling, p.currency),
  orderValue: (c, p) => fmt(c.orderValue, p.currency),
  orderValueC: (c, p) => fmtC(c.orderValue, p.currency),
  amc: (c, p) => fmt(c.amc, p.currency),
  grossMargin: (c) => pct(c.grossMargin, 1),
  netMargin: (c) => pct(c.netMargin, 1),
  basic: (c, p) => fmt(c.basic, p.currency),
  freight: (c, p) => fmt(c.freight, p.currency),
  duty: (c, p) => fmt(c.duty, p.currency),
  landing: (c, p) => fmt(c.landing, p.currency),
  gst: (c, p) => fmt(c.gst, p.currency),
  matTotal: (c, p) => fmt(c.buckets.material, p.currency),
  siteBase: (c, p) => fmt(c.siteBase, p.currency),
  siteTotal: (c, p) => fmt(c.buckets.site, p.currency),
  ohAmt: (c, p) => fmt(c.overheads, p.currency),
  contAmt: (c, p) => fmt(c.contingency, p.currency),
  profitAmt: (c, p) => fmt(c.profit, p.currency),
  orderValueC: (c, p) => fmtC(c.orderValue, p.currency),
  totalOrderC: (c, p) => fmtC(c.totalCost * c.qty, p.currency),
  amcC: (c, p) => fmtC(c.amc, p.currency),
  targetMarkup: (c, p) => p.target ? ((p.target / (c.totalCost || 1) - 1) * 100).toFixed(1) + "%" : "—",
  targetMargin: (c, p) => p.target ? pct((p.target - c.totalCost) / p.target, 1) : "—",
  targetGap: (c, p) => p.target ? (p.target >= c.selling ? "+" : "") + fmtC(p.target - c.selling, p.currency) : "—"
};

/* ------------------------- ANALYSIS (read-only) --------------------------
   Two questions a costing manager asks that a plain build-up cannot answer:
   what is actually driving the number, and how fragile is the margin.      */

/* Net margin if direct cost moves by `delta` while the price is held. */
function marginIfDirect(c, p, delta) {
  const oh = N(p.markup.overheadPct) / 100, ct = N(p.markup.contingencyPct) / 100;
  const total = (c.direct + delta) * (1 + oh) * (1 + ct);
  return c.selling ? (c.selling - total) / c.selling : 0;
}
function sensitivityRows(c, p) {
  const fxPortion = (c.lines.material || []).filter(r => (r.cur || "INR") !== "INR").reduce((s, r) => s + r._amt, 0);
  return [
    { l: "Material", base: c.buckets.material, sw: 10, note: "BOM and landed cost" },
    { l: "Manufacturing + labour", base: c.buckets.manufacturing + c.buckets.labour, sw: 10, note: "Hours and rates" },
    { l: "Design + software", base: c.buckets.design + c.buckets.software, sw: 20, note: "Engineering effort overrun" },
    { l: "Imported content", base: fxPortion, sw: 5, note: "Exchange rate on FX-priced items" },
    { l: "Site & commissioning", base: c.buckets.site, sw: 25, note: "Extended site time" }
  ].filter(d => d.base > 0).map(d => {
    const adverse = marginIfDirect(c, p, d.base * d.sw / 100);
    const favourable = marginIfDirect(c, p, -d.base * d.sw / 100);
    return Object.assign(d, { adverse, favourable, swing: (favourable - adverse) * 100 });
  }).sort((a, b) => b.swing - a.swing);
}
function driverRows(c) {
  const rows = [];
  EQUIP_KEYS.forEach(k => (c.lines[k] || []).forEach(r => {
    const label = r.item || r.proc || r.head || r.disc || r.res || r.cat || "Unnamed line";
    if (r._amt > 0) rows.push({ k, label, amt: r._amt, ref: r.vendor || r.make || r.part || r.scope || r.loc || "" });
  }));
  return rows.sort((a, b) => b.amt - a.amt);
}

function softUpdate() {
  const ap = activeProject();
  if (ap) CALCS[ap.id] = computeProject(ap);   // one project, not the whole portfolio
  const p = ap, c = activeCalc();
  if (!p || !c) return;
  $$("[data-live]").forEach(el => {
    const t = el.dataset.live;
    if (t === "amt") {
      const row = (c.lines[el.dataset.mod] || []).find(r => r.id === el.dataset.row);
      el.textContent = fmt(row ? row._amt : 0, p.currency);
    } else if (t === "modtotal") {
      el.textContent = fmt(c.buckets[el.dataset.mod] || 0, p.currency);
    } else if (t === "tab") {
      const v = c.buckets[el.dataset.mod] || 0;
      el.textContent = v ? fmtC(v, p.currency) : "—";
    } else if (t === "sum") {
      const f = el.dataset.f;
      if (SUMF[f]) el.textContent = SUMF[f](c, p);
      else if (f.startsWith("b_")) el.textContent = fmt(c.buckets[f.slice(2)] || 0, p.currency);
      else if (f.startsWith("p_")) el.textContent = pct((c.buckets[f.slice(2)] || 0) / (c.direct || 1), 0);
    } else if (t === "band") {
      el.textContent = fmtC(bandVal(c, el.dataset.b), p.currency);
    } else if (t === "cum") {
      let cum = 0;
      for (const k of el.dataset.chain.split(",")) { cum += bandVal(c, k); }
      el.textContent = fmt(cum, p.currency);
    }
  });
  $$("[data-bandrow]").forEach(el => {
    el.style.flexGrow = String(Math.max(bandVal(c, el.dataset.bandrow) / (c.selling || 1), 0.012));
  });
  persist();
}

/* --------------------------- PROJECT RECORD ------------------------------ */
function viewDetails() {
  const p = activeProject(), c = activeCalc(), can = CAN();
  const locked = ["Approved", "Won"].includes(p.status);
  const editable = (can.modules === "all" || can.admin) && !locked;
  const dis = editable ? "" : " disabled";
  const f = (k, l, type, list) => `
    <div class="field"><label>${esc(l)}</label>
      ${list
      ? `<select class="inp" data-act="pfield" data-k="${k}"${dis}>${optsWith(list, p[k])}</select>`
      : `<input class="inp${type === "number" ? " mono" : ""}" type="${type || "text"}" value="${esc(p[k])}" data-act="pfield" data-k="${k}"${dis}>`}
    </div>`;
  const floor = approvalFloor(c.orderValue), short = c.netMargin * 100 < floor.minMargin;

  return `<div class="grid" style="grid-template-columns:1.5fr 1fr">
    ${card({
    title: "Project Record",
    right: `${locked ? `<span class="chip amber">${icon("lock", 10)} Locked</span>` : ""}
      <button class="btn sm" data-act="saveTemplate">${icon("clipboard", 12)} Save as template</button>`,
    body: `<div class="grid" style="grid-template-columns:repeat(3,1fr)">
        ${f("code", "Project code")}
        ${f("customer", "Customer", null, S.db.masters.customer.map(x => x.name))}
        ${f("bu", "Business unit", null, S.cfg.businessUnits)}
        <div style="grid-column:span 3">${f("name", "Project name")}</div>
        ${f("category", "Product category", null, S.cfg.productCategories)}
        ${f("machine", "Machine name")}
        ${f("qty", "Quantity", "number")}
        ${f("rev", "Revision")}
        ${f("currency", "Currency", null, S.db.masters.currency.map(x => x.code))}
        ${f("plant", "Plant", null, S.db.masters.plant.map(x => x.name))}
        ${f("salesEngineer", "Sales engineer")}
        ${f("pm", "Project manager")}
        ${f("delivery", "Delivery timeline")}
        <div style="grid-column:span 3"><div class="field"><label>Notes</label>
          <textarea class="inp" rows="3" data-act="pfield" data-k="notes"${dis}>${esc(p.notes)}</textarea></div></div>
      </div>`
  })}

    <div class="grid" style="grid-template-rows:auto auto 1fr;gap:12px">
      ${card({
    title: "Approval Workflow",
    body: `<div class="spread" style="margin-bottom:11px">
          <div><span class="eyebrow">Current status</span><div style="margin-top:4px">${statusChip(p.status)}</div></div>
          <div style="text-align:right"><span class="eyebrow">Required approver</span>
            <div style="font-size:13px;font-weight:500;margin-top:4px">${esc(floor.approver)}</div></div>
        </div>
        ${short ? `<div class="row" style="margin-bottom:10px;padding:8px 10px;background:color-mix(in srgb,var(--signal) 10%,transparent);border:1px solid color-mix(in srgb,var(--signal) 32%,transparent);border-radius:4px;font-size:11.5px">
          <span style="color:var(--signal);flex:0 0 13px">${icon("alert", 13)}</span>
          Net margin ${pct(c.netMargin, 1)} is below the ${floor.minMargin}% floor for ${esc(floor.band)}.</div>` : ""}
        <div class="row" style="flex-wrap:wrap">
          <button class="btn" data-act="status" data-s="Submitted"${p.status !== "Draft" ? " disabled" : ""}>${icon("send", 12)} Submit for approval</button>
          <button class="btn primary" data-act="status" data-s="Approved"${(!can.approve || !["Submitted", "Under Review"].includes(p.status)) ? " disabled" : ""}>${icon("check", 12)} Approve</button>
          <button class="btn" data-act="status" data-s="Returned"${(!can.approve || !["Submitted", "Under Review"].includes(p.status)) ? " disabled" : ""}>${icon("rotate", 12)} Return</button>
          ${locked && can.approve ? `<button class="btn" data-act="status" data-s="Draft">${icon("lock", 12)} Reopen</button>` : ""}
          <button class="btn" data-act="status" data-s="Quoted"${p.status !== "Approved" ? " disabled" : ""}>Mark quoted</button>
        </div>`
  })}
      ${card({
    title: "Headline",
    body: `<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
        ${[["Total cost", fmtC(c.totalCost * c.qty, p.currency)], ["Order value", fmtC(c.orderValue, p.currency)],
    ["Net margin", pct(c.netMargin, 1)], ["AMC value", fmtC(c.amc, p.currency)]]
        .map(([l, v]) => `<div><span class="eyebrow">${l}</span><div class="mono" style="font-size:15px;margin-top:3px">${v}</div></div>`).join("")}
      </div>`
  })}
      ${card({
    title: "Attachments",
    body: `<div class="empty" style="padding:18px 8px">${icon("file", 19)}<h4>No files attached</h4>
        <p style="margin-bottom:0">Drawings, BOM exports and vendor quotations attach to the project record and travel with each frozen revision.</p></div>`
  })}
    </div>
  </div>`;
}

/* ----------------------------- COST BUILDER ------------------------------ */
/* A line that computes to nothing is almost always an omission, not a zero. */
const incomplete = (r) => !(r._amt > 0);

function visibleRows(mod, rows) {
  const q = (S.gridQ[mod.key] || "").toLowerCase().trim();
  let out = q ? rows.filter(r => mod.cols.some(c => String(r[c.k] == null ? "" : r[c.k]).toLowerCase().includes(q))) : rows;
  const st = S.gridSort[mod.key];
  if (st) {
    const col = mod.cols.find(c => c.k === st.k);
    const val = (r) => st.k === "_amt" ? r._amt
      : (col && col.t === "num") ? N(r[st.k]) : String(r[st.k] == null ? "" : r[st.k]).toLowerCase();
    out = out.slice().sort((a, b) => { const A = val(a), B = val(b); return A < B ? -st.dir : A > B ? st.dir : 0; });
  }
  return out;
}

function grid(mod, allRows, canEdit, cur) {
  const dis = canEdit ? "" : " disabled";
  const rows = visibleRows(mod, allRows);
  const st = S.gridSort[mod.key] || {};
  const picked = S.sel[mod.key] || [];
  const arrow = (k) => st.k === k ? `<span class="mono" style="font-size:9px">${st.dir > 0 ? "▲" : "▼"}</span>` : "";
  const th = (k, label, num) => `<th class="sortable ${num ? "num" : ""}" data-act="gridSort" data-mod="${mod.key}" data-k="${k}"
    style="${num ? "" : `width:${label.w || "auto"};`}">${esc(label.l || label)} ${arrow(k)}</th>`;
  const head = `<tr>
    ${canEdit ? `<th style="width:30px" class="no-print"><input type="checkbox" data-act="selAll" data-mod="${mod.key}"
      ${picked.length && picked.length === rows.length ? "checked" : ""} aria-label="Select all lines"></th>` : ""}
    <th style="width:34px">#</th>
    ${mod.cols.map(c => `<th class="sortable ${c.t === "num" ? "num" : ""}" data-act="gridSort" data-mod="${mod.key}" data-k="${c.k}"
      style="width:${c.w};min-width:${c.w}">${esc(c.l)} ${arrow(c.k)}</th>`).join("")}
    <th class="num sortable" style="width:130px" data-act="gridSort" data-mod="${mod.key}" data-k="_amt">Amount ${arrow("_amt")}</th>
    <th style="width:62px" class="no-print"></th></tr>`;

  const body = rows.length ? rows.map((r, i) => `<tr class="${picked.includes(r.id) ? "rowsel" : ""}">
    ${canEdit ? `<td class="no-print"><div class="cell" style="padding:6px 8px"><input type="checkbox" data-act="selRow"
      data-mod="${mod.key}" data-row="${r.id}"${picked.includes(r.id) ? " checked" : ""} aria-label="Select line"></div></td>` : ""}
    <td><span class="calc" style="text-align:left;color:var(--ink-3);font-size:11px"
      ${incomplete(r) ? `title="This line carries no value — check the quantity and rate"` : ""}>
      ${incomplete(r) ? `<i class="flag"></i>` : ""}${String(i + 1).padStart(2, "0")}</span></td>
    ${mod.cols.map(c => {
    const common = `data-act="cell" data-mod="${mod.key}" data-row="${r.id}" data-k="${c.k}"`;
    if (c.t === "item") {
      const it = itemByCode(r[c.k]);
      const mark = r[c.k] && !it ? `<span title="No such stock code" style="color:var(--signal)">${icon("alert", 11)}</span>`
        : isStale(it) ? `<span title="Catalogue price is over ${STALE_DAYS} days old" style="color:var(--amber)">${icon("alert", 11)}</span>` : "";
      return `<td><div style="display:flex;align-items:center;gap:2px;padding-right:4px">
        <input class="cell-input mono" list="tealItemCodes" value="${esc(r[c.k])}" placeholder="—"
          title="${esc(it ? it.name + (it.spec ? " · " + it.spec : "") : "Type or pick a TEAL stock code")}" ${common}${dis}>
        ${mark}<button class="icon-btn no-print" style="width:22px;height:22px;flex:0 0 22px" title="Browse the catalogue"
          data-act="browseItems" data-mod="${mod.key}" data-row="${r.id}"${canEdit ? "" : " disabled"}>${icon("search", 11)}</button>
      </div></td>`;
    }
    if (c.t === "select" || c.t === "master") {
      const list = c.t === "master" ? (S.db.masters[c.m] || []).map(x => x.name) : c.opts;
      return `<td><select class="cell-input" ${common}${dis || (c.ro ? " disabled" : "")}>
          <option value="">—</option>${optsWith(list, r[c.k])}</select></td>`;
    }
    return `<td class="${c.t === "num" ? "num" : ""}"><input class="cell-input${c.t === "num" ? " num" : ""}"
        type="${c.t === "num" ? "number" : "text"}" value="${esc(r[c.k])}" placeholder="${c.t === "num" ? "0" : "—"}"
        ${common}${dis}${c.ro ? " disabled" : ""}></td>`;
  }).join("")}
    <td class="num"><span class="calc" data-live="amt" data-mod="${mod.key}" data-row="${r.id}">${fmt(r._amt || 0, cur)}</span></td>
    <td class="no-print">${canEdit ? `<div class="row rowbtn" style="gap:2px;padding-right:6px">
      <button class="icon-btn" style="width:24px;height:24px" title="Duplicate line" data-act="dupRow" data-mod="${mod.key}" data-row="${r.id}">${icon("copy", 12)}</button>
      <button class="icon-btn" style="width:24px;height:24px" title="Delete line" data-act="delRow" data-mod="${mod.key}" data-row="${r.id}">${icon("trash", 12)}</button>
    </div>` : ""}</td>
  </tr>`).join("")
    : `<tr><td colspan="${mod.cols.length + (canEdit ? 4 : 3)}">${emptyBox(mod.icon,
      (S.gridQ[mod.key] ? `Nothing matches "${esc(S.gridQ[mod.key])}"` : `No ${mod.label} lines yet`),
      canEdit ? "Add the first line to start building this module." : "Nothing has been costed under this head.",
      canEdit ? `<button class="btn primary" data-act="addRow" data-mod="${mod.key}">${icon("plus", 13)} Add line</button>` : "")}</td></tr>`;

  const flagged = allRows.filter(incomplete).length;
  const foot = rows.length ? `<tfoot><tr>
    <td colspan="${mod.cols.length + (canEdit ? 2 : 1)}" style="font-family:var(--cond);letter-spacing:.1em;text-transform:uppercase;font-size:11px">
      ${esc(mod.label)} total · ${rows.length === allRows.length ? `${allRows.length} line${allRows.length > 1 ? "s" : ""}`
        : `${rows.length} of ${allRows.length} shown`}${flagged ? ` · <span style="color:var(--amber)">${flagged} unpriced</span>` : ""}</td>
    <td class="num mono" style="font-size:13.5px" data-live="modtotal" data-mod="${mod.key}">${fmt(rows.reduce((s, r) => s + r._amt, 0), cur)}</td>
    <td class="no-print"></td></tr></tfoot>` : "";

  const bulk = picked.length ? `<div class="bulkbar no-print">
    <b>${picked.length} line${picked.length > 1 ? "s" : ""} selected</b>
    <button class="btn sm" data-act="bulkDup" data-mod="${mod.key}">${icon("copy", 12)} Duplicate</button>
    <button class="btn sm" data-act="bulkDel" data-mod="${mod.key}">${icon("trash", 12)} Delete</button>
    <button class="btn sm ghost" data-act="selClear" data-mod="${mod.key}">Clear selection</button>
    <span style="margin-left:auto" class="mono">${fmt(rows.filter(r => picked.includes(r.id)).reduce((s, r) => s + r._amt, 0), cur)}</span>
  </div>` : "";

  const datalist = mod.cols.some(c => c.t === "item")
    ? `<datalist id="tealItemCodes">${ITEMS().filter(i => i.status !== "Obsolete")
      .map(i => `<option value="${esc(i.code)}">${esc(i.name)} · ${esc(i.spec || "")}</option>`).join("")}</datalist>` : "";

  return `${datalist}<div class="tbl-wrap"><table class="tbl"><thead>${head}</thead><tbody>${body}</tbody>${foot}</table></div>
    ${bulk}
    ${canEdit && rows.length ? `<div class="row no-print" style="padding:10px 12px;border-top:1px solid var(--line-2)">
      <button class="btn sm" data-act="addRow" data-mod="${mod.key}">${icon("plus", 12)} Add line</button>
      <span class="locked">${icon("dot", 11)} Changes recalculate the whole cost sheet instantly and are written to the audit trail.</span>
    </div>` : ""}`;
}

function viewBuilder() {
  const p = activeProject(), c = activeCalc(), can = CAN();
  const mod = MOD_MAP[S.tab] || MODULES[0];
  const editable = can.modules === "all" || (Array.isArray(can.modules) && can.modules.includes(mod.key));
  const locked = ["Approved", "Won"].includes(p.status);
  const canEdit = editable && !locked;
  const cur = p.currency;

  const tabs = MODULES.map(m => {
    const v = c.buckets[m.key] || 0;
    return `<button class="tab${S.tab === m.key ? " active" : ""}" data-act="tab" data-mod="${m.key}">
      ${icon(m.icon, 14)}<span>${esc(m.label)}</span>
      <span class="amt" data-live="tab" data-mod="${m.key}">${v ? fmtC(v, cur) : "—"}</span></button>`;
  }).join("");

  let extra = "";
  if (mod.key === "material") {
    const vend = {};
    (c.lines.material || []).forEach(r => { const k = r.vendor || "Unassigned"; vend[k] = (vend[k] || 0) + r._amt; });
    const vRows = Object.entries(vend).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const vTot = vRows.reduce((s, r) => s + r.value, 0) || 1;
    const h = catalogueHealth(c);
    extra = `${card({
      title: "Catalogue Discipline", style: "margin-bottom:12px",
      right: `<span class="chip ${h.coverage === 1 ? "green" : h.coverage > .7 ? "" : "amber"}">${pct(h.coverage, 0)} of lines linked</span>`,
      body: `<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:12px">
        ${[["Lines on a stock code", `${h.linked.length} of ${h.rows.length}`, h.coverage === 1 ? "var(--green)" : "var(--ink)"],
        ["Value from the catalogue", pct(h.valueCoverage, 0), "var(--ink)"],
        ["Priced away from catalogue", String(h.drift.length), h.drift.length ? "var(--amber)" : "var(--ink-2)"],
        ["On a stale catalogue price", String(h.stale.length), h.stale.length ? "var(--signal)" : "var(--ink-2)"]]
        .map(([l, v, col]) => `<div><span class="eyebrow">${l}</span>
          <div class="mono" style="font-size:17px;margin-top:3px;color:${col}">${v}</div></div>`).join("")}
      </div>
      ${(h.off.length || h.drift.length || h.stale.length) ? `<div style="margin-top:12px;border-top:1px solid var(--line-2);padding-top:11px;font-size:11.5px;color:var(--ink-2);line-height:1.6">
        ${h.off.length ? `<div>${icon("alert", 12)} <b>${h.off.length}</b> line${h.off.length > 1 ? "s carry" : " carries"} an ad-hoc price with no stock code — those figures are nobody's responsibility to keep current.</div>` : ""}
        ${h.drift.length ? `<div style="margin-top:5px">${icon("alert", 12)} <b>${h.drift.length}</b> linked line${h.drift.length > 1 ? "s differ" : " differs"} from today's catalogue price. <b>Re-price</b> pulls them back in line.</div>` : ""}
        ${h.stale.length ? `<div style="margin-top:5px">${icon("alert", 12)} <b>${h.stale.length}</b> line${h.stale.length > 1 ? "s use" : " uses"} a catalogue price older than ${STALE_DAYS} days — refresh the item master before quoting.</div>` : ""}
      </div>` : `<div style="margin-top:11px;font-size:11.5px;color:var(--green)">${icon("check", 12)} Every line is on a current catalogue price.</div>`}`
    })}
    <div class="grid" style="grid-template-columns:1fr 1fr;margin-bottom:12px">
      ${card({
      title: "Landed Cost Build-up",
      body: `<div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
          ${[["freightPct", "Freight %"], ["dutyPct", "Duty %"], ["landingPct", "Landing %"], ["gstPct", "GST % (info)"]]
          .map(([k, l]) => `<div class="field"><label>${l}</label>
            <input class="inp mono" type="number" step="0.1" value="${p.landed[k]}" data-act="landed" data-k="${k}"${canEdit ? "" : " disabled"}></div>`).join("")}
        </div>
        <table class="tbl"><tbody>
          ${[["Basic material value", "basic"], ["Freight", "freight"], ["Customs duty", "duty"], ["Landing & handling", "landing"]]
          .map(([l, f]) => `<tr><td><div class="cell">${l}</div></td>
            <td class="num"><span class="calc" data-live="sum" data-f="${f}">${SUMF[f](c, p)}</span></td></tr>`).join("")}
        </tbody><tfoot>
          <tr><td>Landed material cost</td><td class="num mono" data-live="sum" data-f="matTotal">${SUMF.matTotal(c, p)}</td></tr>
          <tr><td style="color:var(--ink-3);font-weight:400">GST (recoverable — excluded from cost)</td>
            <td class="num mono" style="color:var(--ink-3);font-weight:400" data-live="sum" data-f="gst">${SUMF.gst(c, p)}</td></tr>
        </tfoot></table>`
    })}
      ${card({
      title: "Vendor Concentration",
      body: vRows.length
        ? hbars(vRows.map((r, i) => ({ name: r.name, value: r.value, sub: pct(r.value / vTot, 0), color: i === 0 ? "var(--signal)" : "var(--teal)" })), cur)
        + (vRows[0].value / vTot > .4 ? `<div class="row" style="margin-top:10px;color:var(--signal);font-size:11.5px">
            ${icon("alert", 13)} ${esc(vRows[0].name)} carries ${pct(vRows[0].value / vTot, 0)} of material value — single-source risk.</div>` : "")
        : emptyBox("package", "No material lines", "Vendor split appears once the BOM is populated.")
    })}
    </div>`;
  }
  if (mod.key === "site") {
    extra = card({
      title: "Site Contingency", style: "margin-bottom:12px",
      body: `<div class="row" style="gap:16px">
        <div style="flex:1"><div class="field"><label>Contingency on site cost — ${p.landed.siteContPct}%</label>
          <input class="rng" type="range" min="0" max="25" step="0.5" value="${p.landed.siteContPct}" data-act="landed" data-k="siteContPct"${canEdit ? "" : " disabled"}></div></div>
        <div style="text-align:right"><div class="eyebrow">Base / With contingency</div>
          <div class="mono" style="font-size:15px"><span data-live="sum" data-f="siteBase">${SUMF.siteBase(c, p)}</span> → <span data-live="sum" data-f="siteTotal">${SUMF.siteTotal(c, p)}</span></div></div>
      </div>`
    });
  }
  if (mod.key === "manufacturing" && (c.lines.manufacturing || []).length) {
    const byProc = {};
    c.lines.manufacturing.forEach(r => {
      const k = r.proc || "Unassigned";
      byProc[k] = byProc[k] || { name: k.replace(/ \(.*\)/, ""), value: 0, hrs: 0 };
      byProc[k].value += r._amt; byProc[k].hrs += N(r.hrs) + N(r.setup);
    });
    const pr = Object.values(byProc).sort((a, b) => b.value - a.value)
      .map(r => ({ name: r.name, value: r.value, sub: `${r.hrs.toFixed(1)} hr`, color: BUCKET_COLOR.manufacturing }));
    extra = card({ title: "Cost by Process", style: "margin-bottom:12px", body: hbars(pr, cur) });
  }
  if (mod.key === "amc") {
    extra = card({
      title: "AMC Note", style: "margin-bottom:12px",
      body: `<p style="margin:0;font-size:12.5px;color:var(--ink-2)">AMC is quoted on a separate line and does not form part of the
        equipment selling price. Total contracted AMC value for this project is
        <b class="mono" data-live="sum" data-f="amc">${SUMF.amc(c, p)}</b> across the years entered above.</p>`
    });
  }

  return `
  <div class="card" style="margin-bottom:12px">
    <div class="tabs">${tabs}</div>
    <div class="card-head" style="border-top:1px solid var(--line-2)">
      <div style="min-width:0">
        <h3 style="margin-bottom:3px">${esc(mod.label)}</h3>
        <div style="font-size:11.5px;color:var(--ink-3);max-width:760px">${esc(mod.note)}</div>
      </div>
      <div class="row">
        ${(c.lines[mod.key] || []).length > 6 ? `<span class="gridq no-print">${icon("search", 12)}
          <input placeholder="Filter ${esc(mod.label.toLowerCase())} lines" value="${esc(S.gridQ[mod.key] || "")}"
            data-act="gridQ" data-mod="${mod.key}" aria-label="Filter lines">
          ${S.gridQ[mod.key] ? `<button class="icon-btn" style="width:18px;height:18px;border:none" data-act="gridQClear" data-mod="${mod.key}">${icon("x", 11)}</button>` : ""}
        </span>` : ""}
        ${mod.key === "material" && canEdit ? `<button class="btn sm" data-act="browseItems" data-mod="material">${icon("package", 12)} Catalogue</button>
          <button class="btn sm" data-act="reprice">${icon("rotate", 12)} Re-price</button>` : ""}
        ${canEdit ? `<button class="btn sm" data-act="openImport">${icon("upload", 12)} Import</button>` : ""}
        ${locked ? `<span class="chip amber">${icon("lock", 10)} Locked — ${esc(p.status)}</span>` : ""}
        ${!editable && !locked ? `<span class="chip">${icon("lock", 10)} Read only for your role</span>` : ""}
        <span class="chip teal" data-live="modtotal" data-mod="${mod.key}">${fmt(c.buckets[mod.key] || 0, cur)}</span>
      </div>
    </div>
    ${grid(mod, c.lines[mod.key] || [], canEdit, cur)}
  </div>
  ${extra}`;
}

/* ------------------------------ COST SUMMARY ----------------------------- */
function viewSummary() {
  const p = activeProject(), c = activeCalc(), can = CAN();
  const locked = ["Approved", "Won"].includes(p.status);
  const canEdit = (can.modules === "all" || can.admin) && !locked;
  const cur = p.currency;

  const defs = [
    ...EQUIP_KEYS.map(k => ({ key: k, label: MOD_MAP[k].label, color: BUCKET_COLOR[k] })),
    { key: "oh", label: "Overheads", color: "#6B7F8A" },
    { key: "cont", label: "Contingency", color: "#94A4AD", hatch: true },
    { key: "profit", label: "Profit", color: "var(--signal)", hatch: true }
  ].filter(b => bandVal(c, b.key) > 0);

  const chain = [];
  const bands = defs.map((b, i) => {
    chain.push(b.key);
    const cum = chain.reduce((s, k) => s + bandVal(c, k), 0);
    return `<div class="band-row" data-bandrow="${b.key}" style="flex-grow:${Math.max(bandVal(c, b.key) / (c.selling || 1), .012)}">
      <div class="band${b.hatch ? " hatch" : ""}" style="background:${b.color};color:#fff" title="${esc(b.label)}">
        <span class="band-lbl">${esc(b.label)}</span>
        <span class="band-val" data-live="band" data-b="${b.key}">${fmtC(bandVal(c, b.key), cur)}</span>
      </div>
      <div class="railcell"><div class="dimtick${i === defs.length - 1 ? " term" : ""}">
        <span data-live="cum" data-chain="${chain.join(",")}">${fmt(cum, cur)}</span></div></div>
    </div>`;
  }).join("");

  const floor = approvalFloor(c.orderValue), short = c.netMargin * 100 < floor.minMargin;

  const sliders = [["overheadPct", "Overheads", 40, "ohAmt"], ["contingencyPct", "Contingency", 15, "contAmt"], ["profitPct", "Profit mark-up", 60, "profitAmt"]]
    .map(([k, l, max, f]) => `
      <div style="margin-bottom:13px">
        <div class="spread" style="margin-bottom:4px">
          <label class="eyebrow">${l}</label>
          <div class="row" style="gap:8px">
            <input class="inp mono" type="number" step="0.5" value="${p.markup[k]}" style="width:66px;padding:3px 6px;text-align:right"
              data-act="markup" data-k="${k}"${canEdit ? "" : " disabled"}>
            <span class="mono" style="font-size:12px;min-width:84px;text-align:right;color:var(--ink-2)" data-live="sum" data-f="${f}">${SUMF[f](c, p)}</span>
          </div>
        </div>
        <input class="rng" type="range" min="0" max="${max}" step="0.5" value="${p.markup[k]}" data-act="markup" data-k="${k}"${canEdit ? "" : " disabled"}>
      </div>`).join("");

  const sumRows = EQUIP_KEYS.map(k => `<tr>
      <td><div class="cell row" style="gap:7px"><i style="width:7px;height:7px;border-radius:1px;background:${BUCKET_COLOR[k]}"></i>${esc(MOD_MAP[k].label)}</div></td>
      <td class="num" style="width:62px"><span class="calc" style="color:var(--ink-3);font-size:11px" data-live="sum" data-f="p_${k}">${pct(c.buckets[k] / (c.direct || 1), 0)}</span></td>
      <td class="num"><span class="calc" data-live="sum" data-f="b_${k}">${fmt(c.buckets[k], cur)}</span></td></tr>`).join("");

  const wf = EQUIP_KEYS.map(k => ({ name: MOD_MAP[k].label, short: MOD_MAP[k].short, value: c.buckets[k], color: BUCKET_COLOR[k] })).filter(d => d.value > 0);

  return `
  <div class="grid" style="grid-template-columns:1.25fr 1fr;margin-bottom:12px">
    ${card({
    title: "Cost Build-up", right: `<span class="eyebrow">Per unit · ${cur}</span>`,
    body: `<div class="stackup">${bands}</div>
      <div class="spread" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line-2)">
        <span class="eyebrow">Selling price per unit</span>
        <span class="mono" style="font-size:17px;font-weight:600" data-live="sum" data-f="selling">${fmt(c.selling, cur)}</span></div>`
  })}
    <div class="grid" style="grid-template-rows:auto 1fr;gap:12px">
      ${card({
    title: "Mark-up & Recovery", right: locked ? `<span class="chip amber">${icon("lock", 10)} Locked</span>` : "",
    body: sliders + `
      <div style="border-top:1px solid var(--line-2);margin:2px 0 12px;padding-top:12px">
        <div class="spread" style="margin-bottom:7px">
          <label class="eyebrow">Price to win — target per unit</label>
          <button class="btn sm" data-act="applyTarget"${canEdit && p.target ? "" : " disabled"}>Apply mark-up</button>
        </div>
        <input class="inp mono" type="number" placeholder="What does the customer need to see?"
          value="${p.target ? Math.round(p.target / fxOf(cur)) : ""}" data-act="target"${canEdit ? "" : " disabled"}>
        <div class="row" style="margin-top:8px;gap:14px;flex-wrap:wrap">
          <div><span class="eyebrow">Implied mark-up</span>
            <div class="mono" style="font-size:13px" data-live="sum" data-f="targetMarkup">${SUMF.targetMarkup(c, p)}</div></div>
          <div><span class="eyebrow">Implied net margin</span>
            <div class="mono" style="font-size:13px" data-live="sum" data-f="targetMargin">${SUMF.targetMargin(c, p)}</div></div>
          <div><span class="eyebrow">Gap to current</span>
            <div class="mono" style="font-size:13px" data-live="sum" data-f="targetGap">${SUMF.targetGap(c, p)}</div></div>
        </div>
      </div>
      <div style="padding:9px 11px;background:${short ? "color-mix(in srgb,var(--signal) 10%,transparent)" : "var(--surface-2)"};
        border:1px solid ${short ? "color-mix(in srgb,var(--signal) 35%,transparent)" : "var(--line)"};border-radius:4px">
        <div class="row" style="gap:7px;align-items:flex-start">
          <span style="color:${short ? "var(--signal)" : "var(--green)"};flex:0 0 14px;margin-top:1px">${icon(short ? "alert" : "shield", 14)}</span>
          <div style="font-size:11.5px;line-height:1.45"><b>${esc(floor.band)}</b> — approval by <b>${esc(floor.approver)}</b>, margin floor ${floor.minMargin}%.
          ${short ? ` Net margin is ${pct(c.netMargin, 1)}, ${(floor.minMargin - c.netMargin * 100).toFixed(1)} points short.`
        : ` Net margin ${pct(c.netMargin, 1)} clears the floor.`}</div>
        </div></div>`
  })}
      ${card({
    title: "Summary", pad: false,
    body: `<table class="tbl"><tbody>${sumRows}
        <tr style="background:var(--surface-2)"><td><div class="cell" style="font-weight:600">Direct cost</div></td><td></td>
          <td class="num"><span class="calc" style="font-weight:600" data-live="sum" data-f="direct">${fmt(c.direct, cur)}</span></td></tr>
        <tr><td><div class="cell">Overheads @ ${p.markup.overheadPct}%</div></td><td></td>
          <td class="num"><span class="calc" data-live="sum" data-f="overheads">${fmt(c.overheads, cur)}</span></td></tr>
        <tr><td><div class="cell">Contingency @ ${p.markup.contingencyPct}%</div></td><td></td>
          <td class="num"><span class="calc" data-live="sum" data-f="contingency">${fmt(c.contingency, cur)}</span></td></tr>
        <tr style="background:var(--surface-2)"><td><div class="cell" style="font-weight:600">Total cost</div></td><td></td>
          <td class="num"><span class="calc" style="font-weight:600" data-live="sum" data-f="totalCost">${fmt(c.totalCost, cur)}</span></td></tr>
        <tr><td><div class="cell">Profit @ ${p.markup.profitPct}%</div></td><td></td>
          <td class="num"><span class="calc" style="color:var(--signal)" data-live="sum" data-f="profit">${fmt(c.profit, cur)}</span></td></tr>
      </tbody><tfoot>
        <tr><td>Selling price / unit</td><td></td><td class="num mono" data-live="sum" data-f="selling">${fmt(c.selling, cur)}</td></tr>
        <tr><td>Order value × ${c.qty}</td><td></td><td class="num mono" style="font-size:14px" data-live="sum" data-f="orderValue">${fmt(c.orderValue, cur)}</td></tr>
        ${c.amc > 0 ? `<tr><td style="font-weight:400;color:var(--ink-2)">AMC (separate line)</td><td></td>
          <td class="num mono" style="font-weight:400;color:${BUCKET_COLOR.amc}" data-live="sum" data-f="amc">${fmt(c.amc, cur)}</td></tr>` : ""}
      </tfoot></table>`
  })}
    </div>
  </div>

  <div class="kpi-strip" style="margin-bottom:12px">
    ${kpi({ label: "Direct Cost", value: fmtC(c.direct, cur), sub: "Nine cost modules" })}
    ${kpi({ label: "Total Cost", value: fmtC(c.totalCost, cur), sub: "Incl. OH + contingency" })}
    ${kpi({ label: "Selling / Unit", value: fmtC(c.selling, cur), sub: `${c.qty} unit${c.qty > 1 ? "s" : ""} in order` })}
    ${kpi({ label: "Order Value", value: fmtC(c.orderValue, cur), sub: "Equipment only", color: "var(--teal)" })}
    ${kpi({ label: "Gross Margin", value: pct(c.grossMargin), share: c.grossMargin, color: c.grossMargin < .3 ? "var(--signal)" : "var(--green)" })}
    ${kpi({ label: "Net Margin", value: pct(c.netMargin), share: c.netMargin, color: short ? "var(--signal)" : "var(--green)", sub: `Floor ${floor.minMargin}%` })}
    ${kpi({ label: "Contract Value", value: fmtC(c.contractValue, cur), sub: "Equipment + AMC" })}
  </div>

  ${card({ title: "Direct Cost by Module", right: `<span class="eyebrow">Per unit</span>`, body: vbars(wf, cur), style: "margin-bottom:12px" })}

  <div class="grid" style="grid-template-columns:1.1fr 1fr">
    ${driversCard(c, p)}
    ${sensitivityCard(c, p, floor)}
  </div>`;
}

/* Where the money actually is — the twenty largest lines across all nine
   modules, with the running share of direct cost. */
function driversCard(c, p) {
  const rows = driverRows(c).slice(0, 20);
  const total = c.direct || 1;
  let cum = 0;
  const body = rows.length ? `<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th style="width:34px">#</th><th>Line</th><th>Module</th><th class="num">Amount</th>
      <th class="num">Share</th><th class="num">Cumulative</th></tr></thead>
    <tbody>${rows.map((r, i) => {
    cum += r.amt;
    return `<tr class="clicky" data-act="gotoMod" data-mod="${r.k}" title="Open in the cost builder">
        <td><span class="calc mono" style="text-align:left;font-size:11px;color:var(--ink-3)">${String(i + 1).padStart(2, "0")}</span></td>
        <td><div class="cell" style="max-width:290px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.label)}
          ${r.ref ? `<span style="color:var(--ink-3);font-size:11px"> · ${esc(r.ref)}</span>` : ""}</div></td>
        <td><div class="cell"><span class="chip" style="border-color:${BUCKET_COLOR[r.k]};color:${BUCKET_COLOR[r.k]}">${esc(MOD_MAP[r.k].short)}</span></div></td>
        <td class="num"><span class="calc">${fmt(r.amt, p.currency)}</span></td>
        <td class="num"><span class="calc" style="color:var(--ink-3)">${pct(r.amt / total, 1)}</span></td>
        <td class="num"><span class="calc">${pct(cum / total, 0)}</span></td></tr>`;
  }).join("")}</tbody></table></div>`
    : emptyBox("layers", "Nothing costed yet", "Cost drivers appear once lines are entered.");
  const top5 = driverRows(c).slice(0, 5).reduce((s, r) => s + r.amt, 0);
  return card({
    title: "Cost Drivers", pad: false,
    right: `<span class="eyebrow">Top 5 = ${pct(top5 / total, 0)} of direct cost</span>`,
    body
  });
}

/* How fragile the margin is. Price is held; each driver is swung by a
   realistic amount and the resulting net margin is read off. */
function sensitivityCard(c, p, floor) {
  const rows = sensitivityRows(c, p);
  const body = rows.length ? `<table class="tbl">
    <thead><tr><th>Driver</th><th class="num">Swing</th><th class="num">Favourable</th><th class="num">Adverse</th><th class="num">Points</th></tr></thead>
    <tbody>${rows.map(r => {
    const breaks = r.adverse * 100 < floor.minMargin;
    return `<tr>
        <td><div class="cell">${esc(r.l)}<div style="font-size:11px;color:var(--ink-3)">${esc(r.note)}</div></div></td>
        <td class="num"><span class="calc" style="color:var(--ink-3)">±${r.sw}%</span></td>
        <td class="num"><span class="calc" style="color:var(--green)">${pct(r.favourable, 1)}</span></td>
        <td class="num"><span class="calc" style="color:${breaks ? "var(--signal)" : "var(--ink)"}">${pct(r.adverse, 1)}</span></td>
        <td class="num"><span class="calc mono" style="color:var(--ink-3)">${r.swing.toFixed(1)}</span></td></tr>`;
  }).join("")}</tbody></table>
    <div style="padding:10px 12px;border-top:1px solid var(--line-2);font-size:11.5px;color:var(--ink-3);line-height:1.55">
      Selling price is held at <b class="mono">${fmt(c.selling, p.currency)}</b>. Any adverse figure shown in
      ${`<span style="color:var(--signal)">this colour</span>`} would put the order below the ${floor.minMargin}% floor for
      ${esc(floor.band)} — those are the drivers worth firming up with a vendor quotation before the offer goes out.</div>`
    : emptyBox("alert", "Nothing to test", "Sensitivity appears once the cost modules carry values.");
  return card({ title: "Margin Sensitivity", pad: false, right: `<span class="eyebrow">Price held</span>`, body });
}

/* ------------------------------- REVISIONS ------------------------------- */
function viewRevisions() {
  const p = activeProject(), c = activeCalc(), cur = p.currency;
  const snaps = [...p.revisions.map(r => ({ ...r, live: false })),
  { rev: p.rev, ts: p.updatedAt, user: p.pm, note: "Working revision (live)", live: true, selling: c.selling, buckets: c.buckets }];
  S.revA = Math.min(S.revA, snaps.length - 1); S.revB = Math.min(S.revB, snaps.length - 1);
  const A = snaps[S.revA], B = snaps[S.revB];
  const both = A.buckets && B.buckets;

  const hist = snaps.map(s => `<tr>
    <td><div class="cell"><span class="chip ${s.live ? "teal" : ""}">${esc(s.rev)}${s.live ? " · live" : ""}</span></div></td>
    <td><div class="cell" style="font-size:11.5px">${dstr(s.ts)}<div style="color:var(--ink-3);font-size:11px">${esc(s.note)}</div></div></td>
    <td><div class="cell" style="font-size:11.5px">${esc(s.user)}</div></td>
    <td class="num"><span class="calc">${fmtC(s.selling, cur)}</span></td></tr>`).join("");

  const cmp = both ? `<table class="tbl">
    <thead><tr><th>Cost head</th><th class="num">Rev ${esc(A.rev)}</th><th class="num">Rev ${esc(B.rev)}</th><th class="num">Delta</th><th class="num">%</th></tr></thead>
    <tbody>${EQUIP_KEYS.map(k => {
    const av = A.buckets[k] || 0, bv = B.buckets[k] || 0, d = bv - av;
    const cls = d > 0 ? "delta-up" : d < 0 ? "delta-dn" : "";
    return `<tr>
        <td><div class="cell row" style="gap:7px"><i style="width:7px;height:7px;background:${BUCKET_COLOR[k]};border-radius:1px"></i>${esc(MOD_MAP[k].label)}</div></td>
        <td class="num"><span class="calc">${fmtC(av, cur)}</span></td>
        <td class="num"><span class="calc">${fmtC(bv, cur)}</span></td>
        <td class="num"><span class="calc ${cls}">${d === 0 ? "—" : (d > 0 ? "+" : "") + fmtC(d, cur)}</span></td>
        <td class="num"><span class="calc ${cls}" style="font-size:11px">${av ? ((d / av) * 100).toFixed(1) + "%" : "—"}</span></td></tr>`;
  }).join("")}</tbody>
    <tfoot><tr><td>Selling price</td>
      <td class="num mono">${fmtC(A.selling, cur)}</td><td class="num mono">${fmtC(B.selling, cur)}</td>
      <td class="num mono" style="color:${B.selling > A.selling ? "var(--red)" : "var(--green)"}">${(B.selling > A.selling ? "+" : "") + fmtC(B.selling - A.selling, cur)}</td>
      <td class="num mono">${A.selling ? ((B.selling - A.selling) / A.selling * 100).toFixed(1) + "%" : "—"}</td></tr></tfoot></table>`
    : emptyBox("compare", "Snapshot not available",
      `Revisions frozen before this project moved onto the platform hold headline values only.<br>
       Selling price moved from <b class="mono">${fmtC(A.selling, cur)}</b> to <b class="mono">${fmtC(B.selling, cur)}</b>
       (${((B.selling - A.selling) / (A.selling || 1) * 100).toFixed(1)}%).`);

  const sel = (which, val) => `<select class="inp" style="width:116px;padding:3px 6px;font-size:11.5px" data-act="rev${which}">
    ${snaps.map((s, i) => `<option value="${i}"${i === val ? " selected" : ""}>Rev ${esc(s.rev)}${s.live ? " (live)" : ""}</option>`).join("")}</select>`;

  return `<div class="grid" style="grid-template-columns:1fr 1.4fr">
    ${card({
    title: "Revision History", pad: false,
    right: `<button class="btn sm" data-act="freeze">${icon("save", 12)} Freeze revision ${esc(p.rev)}</button>`,
    body: `<table class="tbl"><thead><tr><th>Rev</th><th>Frozen on</th><th>By</th><th class="num">Selling price</th></tr></thead>
      <tbody>${hist}</tbody></table>
      <div style="padding:10px 12px;border-top:1px solid var(--line-2);font-size:11.5px;color:var(--ink-3)">
        Freezing stores a full cost snapshot and advances the revision letter. Frozen revisions are never overwritten.</div>`
  })}
    ${card({
    title: "Version Comparison", pad: false,
    right: `<div class="row" style="gap:6px">${sel("A", S.revA)}${icon("compare", 13)}${sel("B", S.revB)}</div>`,
    body: cmp
  })}
  </div>`;
}

/* -------------------------------- REPORTS -------------------------------- */
const REPORTS = [
  { k: "internal", l: "Internal Cost Sheet", d: "Full line-item build-up with margins. Internal circulation only." },
  { k: "customer", l: "Customer Cost Sheet", d: "Scope-grouped pricing with no internal cost or margin disclosed." },
  { k: "quotation", l: "Quotation Summary", d: "Commercial offer summary with terms, delivery and AMC options." },
  { k: "margin", l: "Margin Analysis", d: "Portfolio margin against approval floors by business unit." },
  { k: "profitability", l: "Project Profitability", d: "Cost, price and contribution across all live projects." }
];
const csvCell = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
const toCSV = (rows) => rows.map(r => r.map(csvCell).join(",")).join("\n");

function exportProjectCSV() {
  const p = activeProject(), c = activeCalc(), out = [];
  out.push(["TEAL — Internal Cost Sheet"], [p.code, p.name], ["Customer", p.customer], ["Business Unit", p.bu],
    ["Revision", p.rev], ["Quantity", p.qty], ["Currency", p.currency], ["Generated", new Date().toLocaleString("en-IN")], []);
  MODULES.forEach(m => {
    const rows = c.lines[m.key] || []; if (!rows.length) return;
    out.push([m.label.toUpperCase()], [...m.cols.map(x => x.l), "Amount"]);
    rows.forEach(r => out.push([...m.cols.map(x => r[x.k]), Math.round(r._amt)]));
    out.push(["", "", "", "", "", "Module total", Math.round(c.buckets[m.key])], []);
  });
  out.push(["COST SUMMARY"],
    ["Direct cost", Math.round(c.direct)], ["Overheads", Math.round(c.overheads)], ["Contingency", Math.round(c.contingency)],
    ["Total cost", Math.round(c.totalCost)], ["Profit", Math.round(c.profit)], ["Selling price / unit", Math.round(c.selling)],
    ["Order value", Math.round(c.orderValue)], ["AMC value", Math.round(c.amc)],
    ["Gross margin %", (c.grossMargin * 100).toFixed(2)], ["Net margin %", (c.netMargin * 100).toFixed(2)]);
  downloadFile(`${p.code}_Rev${p.rev}_CostSheet.csv`, toCSV(out), "text/csv");
}
function exportPortfolioCSV(kind) {
  const rows = [["Code", "Project", "Customer", "Business unit", "Qty", "Direct cost", "Total cost", "Selling price", "Order value", "Gross margin %", "Net margin %", "Approval floor %", "Status"]];
  S.db.projects.forEach(p => {
    const c = CALCS[p.id], f = approvalFloor(c.orderValue);
    rows.push([p.code, p.name, p.customer, p.bu, p.qty, Math.round(c.direct), Math.round(c.totalCost),
    Math.round(c.selling), Math.round(c.orderValue), (c.grossMargin * 100).toFixed(2), (c.netMargin * 100).toFixed(2), f.minMargin, p.status]);
  });
  downloadFile(`TEAL_${kind === "margin" ? "MarginAnalysis" : "Profitability"}.csv`, toCSV(rows), "text/csv");
}

const sheetHead = (p, title, cls) => tb([
  { l: "Document", v: title, w: "1.5fr", wide: true },
  { l: "Project", v: p.code, w: ".9fr" }, { l: "Customer", v: p.customer, w: "1.1fr" },
  { l: "Rev", v: p.rev, w: ".4fr" }, { l: "Qty", v: p.qty, w: ".4fr" },
  { l: "Issued", v: dstr(nowISO()), w: ".7fr" },
  { l: "Classification", v: cls, w: ".9fr", color: cls === "Internal" ? "var(--signal)" : "var(--teal)" }
]);

function reportInternal(p, c) {
  const cur = p.currency;
  const head = EQUIP_KEYS.map(k => `<tr>
    <td><div class="cell row" style="gap:7px"><i style="width:7px;height:7px;background:${BUCKET_COLOR[k]};border-radius:1px"></i>${esc(MOD_MAP[k].label)}</div></td>
    <td><div class="cell" style="font-size:11.5px;color:var(--ink-3)">${esc(MOD_MAP[k].note.split(".")[0])}</div></td>
    <td class="num"><span class="calc">${(c.lines[k] || []).length}</span></td>
    <td class="num"><span class="calc">${fmt(c.buckets[k], cur)}</span></td>
    <td class="num"><span class="calc">${fmt(c.buckets[k] * c.qty, cur)}</span></td>
    <td class="num"><span class="calc" style="color:var(--ink-3)">${pct(c.buckets[k] / (c.totalCost || 1), 1)}</span></td></tr>`).join("");

  const detail = MODULES.filter(m => (c.lines[m.key] || []).length).map(m => card({
    title: `${m.label} — line detail`, pad: false, style: "margin-bottom:12px",
    body: `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th style="width:30px">#</th>${m.cols.map(x => `<th class="${x.t === "num" ? "num" : ""}">${esc(x.l)}</th>`).join("")}<th class="num">Amount</th></tr></thead>
      <tbody>${c.lines[m.key].map((r, i) => `<tr>
        <td><div class="cell mono" style="font-size:11px;color:var(--ink-3)">${String(i + 1).padStart(2, "0")}</div></td>
        ${m.cols.map(x => `<td class="${x.t === "num" ? "num" : ""}"><div class="cell${x.t === "num" ? " mono" : ""}">${x.t === "num" ? N(r[x.k]).toLocaleString("en-IN") : esc(r[x.k] || "—")}</div></td>`).join("")}
        <td class="num"><span class="calc">${fmt(r._amt, cur)}</span></td></tr>`).join("")}</tbody>
      <tfoot><tr><td colspan="${m.cols.length + 1}">${esc(m.label)} total</td><td class="num mono">${fmt(c.buckets[m.key], cur)}</td></tr></tfoot>
    </table></div>`
  })).join("");

  return sheetHead(p, "Internal Cost Sheet", "Internal") + card({
    title: p.name, pad: false, style: "margin-bottom:12px",
    body: `<table class="tbl"><thead><tr><th>Cost head</th><th>Basis</th><th class="num">Lines</th>
      <th class="num">Per unit</th><th class="num">Order total</th><th class="num">% of cost</th></tr></thead>
      <tbody>${head}
        <tr style="background:var(--surface-2)"><td colspan="3"><div class="cell" style="font-weight:600">Direct cost</div></td>
          <td class="num"><span class="calc" style="font-weight:600">${fmt(c.direct, cur)}</span></td>
          <td class="num"><span class="calc" style="font-weight:600">${fmt(c.direct * c.qty, cur)}</span></td><td></td></tr>
        <tr><td colspan="3"><div class="cell">Overheads @ ${p.markup.overheadPct}% · ${esc(p.plant)}</div></td>
          <td class="num"><span class="calc">${fmt(c.overheads, cur)}</span></td>
          <td class="num"><span class="calc">${fmt(c.overheads * c.qty, cur)}</span></td><td></td></tr>
        <tr><td colspan="3"><div class="cell">Contingency @ ${p.markup.contingencyPct}%</div></td>
          <td class="num"><span class="calc">${fmt(c.contingency, cur)}</span></td>
          <td class="num"><span class="calc">${fmt(c.contingency * c.qty, cur)}</span></td><td></td></tr>
        <tr style="background:var(--surface-2)"><td colspan="3"><div class="cell" style="font-weight:600">Total cost</div></td>
          <td class="num"><span class="calc" style="font-weight:600">${fmt(c.totalCost, cur)}</span></td>
          <td class="num"><span class="calc" style="font-weight:600">${fmt(c.totalCost * c.qty, cur)}</span></td><td></td></tr>
        <tr><td colspan="3"><div class="cell">Profit @ ${p.markup.profitPct}%</div></td>
          <td class="num"><span class="calc" style="color:var(--signal)">${fmt(c.profit, cur)}</span></td>
          <td class="num"><span class="calc" style="color:var(--signal)">${fmt(c.profit * c.qty, cur)}</span></td><td></td></tr>
      </tbody>
      <tfoot><tr><td colspan="3">Selling price</td><td class="num mono">${fmt(c.selling, cur)}</td>
        <td class="num mono" style="font-size:14px">${fmt(c.orderValue, cur)}</td>
        <td class="num mono">GM ${pct(c.grossMargin, 1)}</td></tr></tfoot></table>`
  }) + detail;
}

function reportCustomer(p, c) {
  const cur = p.currency;
  const groups = [
    ["Mechanical scope — structure, tooling and motion hardware", c.buckets.material * .55 + c.buckets.mechanical + c.buckets.manufacturing],
    ["Electrical & control scope — panels, drives, sensors and safety", c.buckets.material * .45 + c.buckets.electrical],
    ["Engineering, software and validation", c.buckets.design + c.buckets.software],
    ["Build, testing and factory acceptance", c.buckets.labour],
    ["Installation, commissioning and training at site", c.buckets.site],
    ["Freight, packing, certification and warranty", c.buckets.commercial]
  ];
  const gross = groups.reduce((s, g) => s + g[1], 0);
  const scale = gross ? c.selling / gross : 1;
  return sheetHead(p, "Customer Cost Sheet", "Customer") + card({
    title: `${p.machine} — ${p.name}`, pad: false, style: "margin-bottom:12px",
    body: `<table class="tbl"><thead><tr><th style="width:40px">Item</th><th>Scope of supply</th>
      <th class="num">Unit price</th><th class="num">Qty</th><th class="num">Amount</th></tr></thead>
      <tbody>${groups.map(([l, v], i) => `<tr>
        <td><div class="cell mono" style="color:var(--ink-3)">${String(i + 1).padStart(2, "0")}</div></td>
        <td><div class="cell">${esc(l)}</div></td>
        <td class="num"><span class="calc">${fmt(v * scale, cur)}</span></td>
        <td class="num"><span class="calc">${p.qty}</span></td>
        <td class="num"><span class="calc">${fmt(v * scale * c.qty, cur)}</span></td></tr>`).join("")}</tbody>
      <tfoot><tr><td colspan="4">Total ex-works, before taxes</td>
        <td class="num mono" style="font-size:14px">${fmt(c.orderValue, cur)}</td></tr>
        ${c.amc > 0 ? `<tr><td colspan="4" style="font-weight:400">Optional annual maintenance contract</td>
          <td class="num mono" style="font-weight:400">${fmt(c.amc, cur)}</td></tr>` : ""}</tfoot></table>`
  }) + `<div style="font-size:11.5px;color:var(--ink-3);padding:0 2px">
    Prices are ex-works ${esc(p.plant)}, exclusive of GST. Delivery ${esc(p.delivery || "to be confirmed")} from receipt of
    technically and commercially clear order. Internal cost and margin are not disclosed on this document.</div>`;
}

function reportQuotation(p, c) {
  const cust = S.db.masters.customer.find(x => x.name === p.customer);
  const rows = [["Equipment", p.machine], ["Configuration", p.name], ["Business unit", p.bu],
  ["Quantity", `${p.qty} unit${p.qty > 1 ? "s" : ""}`], ["Delivery", p.delivery || "To be confirmed"],
  ["Manufacturing plant", p.plant], ["Payment terms", (cust && cust.terms) || "As per contract"],
  ["Validity", "60 days from date of issue"], ["Warranty", "12 months from commissioning or 15 from despatch"],
  ["Currency", p.currency]];
  return sheetHead(p, "Quotation Summary", "Customer") + `<div class="grid" style="grid-template-columns:1.3fr 1fr">
    ${card({
    title: "Offer", pad: false,
    body: `<table class="tbl"><tbody>${rows.map(([l, v]) => `<tr>
        <td style="width:190px"><div class="cell eyebrow" style="display:block">${esc(l)}</div></td>
        <td><div class="cell">${esc(v)}</div></td></tr>`).join("")}</tbody>
      <tfoot><tr><td>Order value, ex-works</td><td class="num mono" style="font-size:15px">${fmt(c.orderValue, p.currency)}</td></tr>
      ${c.amc > 0 ? `<tr><td style="font-weight:400">AMC (optional)</td><td class="num mono" style="font-weight:400">${fmt(c.amc, p.currency)}</td></tr>` : ""}</tfoot></table>`
  })}
    ${card({
    title: "Notes & Exclusions",
    body: `<ul style="margin:0;padding-left:17px;font-size:12.5px;line-height:1.7;color:var(--ink-2)">
      <li>Prices exclusive of GST, currently ${p.landed.gstPct}% on machinery.</li>
      <li>Civil work, foundation, utilities and compressed air at customer scope.</li>
      <li>Customer to provide production parts for buy-off at least four weeks before FAT.</li>
      <li>Site work assumes continuous access; idle time is chargeable at prevailing rates.</li>
      <li>Imported content is quoted at the exchange rate on the date of offer and is subject to revision.</li>
      <li>${esc(p.notes || "No additional conditions recorded.")}</li></ul>`
  })}
  </div>`;
}

function reportPortfolio(kind) {
  const cur = S.currency;
  const rows = S.db.projects.map(p => ({ p, c: CALCS[p.id], f: approvalFloor(CALCS[p.id].orderValue) }))
    .sort((a, b) => b.c.orderValue - a.c.orderValue);
  const tot = rows.reduce((a, r) => ({
    order: a.order + r.c.orderValue, cost: a.cost + r.c.totalCost * r.c.qty, profit: a.profit + r.c.profit * r.c.qty
  }), { order: 0, cost: 0, profit: 0 });
  return tb([
    { l: "Document", v: kind === "margin" ? "Margin Analysis" : "Project Profitability", w: "1.5fr", wide: true },
    { l: "Projects", v: rows.length, w: ".5fr" }, { l: "Order value", v: fmtC(tot.order, cur), w: ".9fr" },
    { l: "Contribution", v: fmtC(tot.profit, cur), w: ".9fr" },
    { l: "Blended margin", v: pct(tot.order ? tot.profit / tot.order : 0), w: ".8fr" },
    { l: "Issued", v: dstr(nowISO()), w: ".7fr" }
  ]) + card({
    title: kind === "margin" ? "Margin vs approval floor" : "Cost, price and contribution", pad: false,
    body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Project</th><th>Business unit</th>
      <th class="num">Total cost</th><th class="num">Order value</th><th class="num">Contribution</th>
      <th class="num">Gross %</th><th class="num">Net %</th><th class="num">Floor %</th><th>Verdict</th></tr></thead>
      <tbody>${rows.map(({ p, c, f }) => {
      const ok = c.netMargin * 100 >= f.minMargin;
      return `<tr>
          <td><span class="calc mono" style="text-align:left;font-size:11.5px">${esc(p.code)}</span></td>
          <td><div class="cell" style="max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</div></td>
          <td><div class="cell" style="font-size:12px;color:var(--ink-2)">${esc(p.bu)}</div></td>
          <td class="num"><span class="calc">${fmtC(c.totalCost * c.qty, cur)}</span></td>
          <td class="num"><span class="calc">${fmtC(c.orderValue, cur)}</span></td>
          <td class="num"><span class="calc">${fmtC(c.profit * c.qty, cur)}</span></td>
          <td class="num"><span class="calc">${pct(c.grossMargin, 1)}</span></td>
          <td class="num"><span class="calc" style="color:${ok ? "var(--green)" : "var(--signal)"}">${pct(c.netMargin, 1)}</span></td>
          <td class="num"><span class="calc" style="color:var(--ink-3)">${f.minMargin}%</span></td>
          <td><div class="cell"><span class="chip ${ok ? "green" : "red"}">${ok ? "Clears" : "Below floor"}</span></div></td></tr>`;
    }).join("")}</tbody>
      <tfoot><tr><td colspan="3">Portfolio</td>
        <td class="num mono">${fmtC(tot.cost, cur)}</td><td class="num mono">${fmtC(tot.order, cur)}</td>
        <td class="num mono">${fmtC(tot.profit, cur)}</td>
        <td colspan="2" class="num mono">${pct(tot.order ? tot.profit / tot.order : 0, 1)} net</td>
        <td colspan="2"></td></tr></tfoot></table></div>`
  });
}

function viewReports() {
  const p = activeProject(), c = activeCalc(), can = CAN();
  const R = REPORTS.find(r => r.k === S.reportKind);
  const bar = `<div class="row no-print" style="margin-bottom:12px;flex-wrap:wrap">
    ${REPORTS.map(r => `<button class="btn${S.reportKind === r.k ? " primary" : ""}" data-act="report" data-k="${r.k}">${esc(r.l)}</button>`).join("")}
    <div style="flex:1"></div>
    <button class="btn" data-act="print">${icon("printer", 13)} Print / PDF</button>
    <button class="btn primary" data-act="exportReport"${can.export ? "" : " disabled"}>${icon("download", 13)} Export</button>
  </div><div style="font-size:12px;color:var(--ink-3);margin-bottom:12px" class="no-print">${esc(R.d)}</div>`;

  const body = S.reportKind === "internal" ? reportInternal(p, c)
    : S.reportKind === "customer" ? reportCustomer(p, c)
      : S.reportKind === "quotation" ? reportQuotation(p, c)
        : reportPortfolio(S.reportKind);
  return bar + body;
}

/* -------------------------------- MASTERS -------------------------------- */
const MASTER_SPEC = [
  {
    k: "item", l: "Item Master · Stock Codes", icon: "package",
    cols: [
      { k: "code", l: "Stock code", w: "140px" }, { k: "name", l: "Description", w: "230px" },
      { k: "spec", l: "Specification", w: "250px" }, { k: "cat", l: "Category", w: "150px" },
      { k: "cls", l: "Class", w: "160px" }, { k: "uom", l: "UOM", w: "70px" },
      { k: "price", l: "Price", t: "num", w: "110px" }, { k: "cur", l: "Cur", w: "70px" },
      { k: "vendor", l: "Preferred vendor", w: "170px" }, { k: "lead", l: "Lead wk", t: "num", w: "85px" },
      { k: "moq", l: "MOQ", t: "num", w: "75px" }, { k: "hsn", l: "HSN", w: "105px" },
      { k: "updated", l: "Price date", w: "115px" }, { k: "status", l: "Status", w: "105px" }
    ],
    blank: () => ({
      id: uid(), code: nextItemCode("GEN"), name: "", spec: "", cat: "", cls: "Standard Component",
      uom: "no", price: 0, cur: "INR", vendor: "", lead: 4, moq: 1, hsn: "",
      updated: new Date().toISOString().slice(0, 10), status: "Active"
    })
  },
  { k: "material", l: "Material Rates", icon: "package", cols: [{ k: "name", l: "Material" }, { k: "uom", l: "UOM", w: "80px" }, { k: "rate", l: "Rate ₹", t: "num", w: "110px" }, { k: "scrap", l: "Scrap %", t: "num", w: "100px" }], blank: () => ({ id: uid(), name: "", uom: "kg", rate: 0, scrap: 0 }) },
  { k: "process", l: "Machine Hour Rates", icon: "factory", cols: [{ k: "name", l: "Process" }, { k: "dept", l: "Department", w: "160px" }, { k: "uom", l: "UOM", w: "80px" }, { k: "rate", l: "Rate ₹/hr", t: "num", w: "120px" }], blank: () => ({ id: uid(), name: "", dept: "", uom: "hr", rate: 0 }) },
  { k: "labour", l: "Labour Rates", icon: "users", cols: [{ k: "name", l: "Category" }, { k: "uom", l: "Basis", w: "100px" }, { k: "rate", l: "Rate ₹/day", t: "num", w: "120px" }, { k: "ot", l: "OT ₹/hr", t: "num", w: "110px" }], blank: () => ({ id: uid(), name: "", uom: "manday", rate: 0, ot: 0 }) },
  { k: "engineering", l: "Engineering Rates", icon: "ruler", cols: [{ k: "name", l: "Discipline" }, { k: "dept", l: "Department", w: "160px" }, { k: "uom", l: "Basis", w: "100px" }, { k: "rate", l: "Rate ₹/day", t: "num", w: "120px" }], blank: () => ({ id: uid(), name: "", dept: "", uom: "manday", rate: 0 }) },
  { k: "vendor", l: "Vendor Master", icon: "truck", cols: [{ k: "name", l: "Vendor" }, { k: "category", l: "Category", w: "170px" }, { k: "terms", l: "Payment terms", w: "130px" }, { k: "lead", l: "Lead time", w: "110px" }, { k: "rating", l: "Rating", w: "80px" }], blank: () => ({ id: uid(), name: "", category: "", terms: "30 days", lead: "", rating: "B" }) },
  { k: "customer", l: "Customer Master", icon: "building", cols: [{ k: "name", l: "Customer" }, { k: "segment", l: "Segment", w: "150px" }, { k: "gstin", l: "GSTIN", w: "180px" }, { k: "terms", l: "Payment terms", w: "130px" }], blank: () => ({ id: uid(), name: "", segment: "", gstin: "", terms: "60 days" }) },
  { k: "currency", l: "Currency Rates", icon: "receipt", cols: [{ k: "code", l: "Code", w: "90px" }, { k: "name", l: "Currency" }, { k: "symbol", l: "Symbol", w: "90px" }, { k: "rate", l: "Rate to INR", t: "num", w: "130px" }], blank: () => ({ id: uid(), code: "", name: "", symbol: "", rate: 1 }) },
  { k: "tax", l: "Taxes & Duties", icon: "receipt", cols: [{ k: "name", l: "Head" }, { k: "type", l: "Type", w: "120px" }, { k: "rate", l: "Rate %", t: "num", w: "110px" }], blank: () => ({ id: uid(), name: "", type: "GST", rate: 0 }) },
  { k: "freight", l: "Freight Charges", icon: "truck", cols: [{ k: "name", l: "Mode" }, { k: "basis", l: "Basis", w: "170px" }, { k: "rate", l: "Rate", t: "num", w: "110px" }], blank: () => ({ id: uid(), name: "", basis: "% of value", rate: 0 }) },
  { k: "plant", l: "Plants & Overheads", icon: "factory", cols: [{ k: "name", l: "Plant" }, { k: "capacity", l: "Capacity", w: "140px" }, { k: "ohRate", l: "Overhead %", t: "num", w: "130px" }], blank: () => ({ id: uid(), name: "", capacity: "2-shift", ohRate: 14 }) },
  { k: "approval", l: "Approval Matrix", icon: "shield", cols: [{ k: "band", l: "Order value band" }, { k: "approver", l: "Approver", w: "190px" }, { k: "minMargin", l: "Margin floor %", t: "num", w: "140px" }], blank: () => ({ id: uid(), band: "", approver: "", minMargin: 20 }) }
];

function viewMasters() {
  const can = CAN(), spec = MASTER_SPEC.find(s => s.k === S.masterTab), rows = S.db.masters[spec.k] || [];
  const dis = can.masters ? "" : " disabled";
  return tb([
    { l: "Sheet", v: "Master Data", w: "1.3fr", wide: true },
    { l: "Table", v: spec.l, w: "1.1fr" }, { l: "Records", v: rows.length, w: ".5fr" },
    { l: "Write access", v: can.masters ? "Granted" : "Read only", w: ".8fr", color: can.masters ? "var(--green)" : "var(--signal)" },
    { l: "Effect", v: "Applies to new calculations", w: "1.1fr" }
  ]) + `<div class="grid" style="grid-template-columns:218px 1fr">
    ${card({
    title: "Tables", pad: false,
    body: `<div style="padding:7px">${MASTER_SPEC.map(s => `
        <button class="nav-item${S.masterTab === s.k ? " active" : ""}" data-act="masterTab" data-k="${s.k}">
          ${icon(s.icon, 14)}<span class="lbl">${esc(s.l)}</span>
          <span class="mono" style="margin-left:auto;font-size:10.5px;color:var(--ink-3)">${(S.db.masters[s.k] || []).length}</span>
        </button>`).join("")}</div>`
  })}
    ${card({
    title: spec.l, pad: false,
    right: can.masters
      ? `<button class="btn sm" data-act="importMaster">${icon("upload", 12)} Import CSV</button>
         <button class="btn sm" data-act="exportMasters">${icon("download", 12)} Export JSON</button>
         <button class="btn sm primary" data-act="addMaster">${icon("plus", 12)} Add record</button>`
      : `<span class="locked">${icon("lock", 11)} Your role cannot edit masters</span>`,
    body: `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th style="width:34px">#</th>
        ${spec.cols.map(c => `<th class="${c.t === "num" ? "num" : ""}" style="width:${c.w || "auto"}">${esc(c.l)}</th>`).join("")}
        <th style="width:40px" class="no-print"></th></tr></thead>
      <tbody>${rows.map((r, i) => `<tr>
        <td><span class="calc mono" style="text-align:left;font-size:11px;color:var(--ink-3)">${String(i + 1).padStart(2, "0")}</span></td>
        ${spec.cols.map(c => `<td class="${c.t === "num" ? "num" : ""}">
          <input class="cell-input${c.t === "num" ? " num" : ""}" type="${c.t === "num" ? "number" : "text"}"
            value="${esc(r[c.k])}" data-act="mcell" data-row="${r.id}" data-k="${c.k}"${dis}></td>`).join("")}
        <td class="no-print">${can.masters ? `<div class="cell rowbtn">
          <button class="icon-btn" style="width:24px;height:24px" data-act="delMaster" data-row="${r.id}" title="Delete record">${icon("trash", 12)}</button></div>` : ""}</td>
      </tr>`).join("")}</tbody></table></div>
      <div style="padding:10px 12px;border-top:1px solid var(--line-2);font-size:11.5px;color:var(--ink-3)">
        Master changes flow into every calculation from the moment they are saved. Export JSON writes this table back to
        <span class="mono">data/masters.json</span> format so it can be committed as the new baseline.</div>`
  })}
  </div>`;
}

/* ------------------------------- TEMPLATES ------------------------------- */
function viewTemplates() {
  const can = CAN(), t = S.db.templates || [];
  const count = (x) => MODULES.reduce((s, m) => s + ((x.lines[m.key] || []).length), 0);
  return tb([
    { l: "Sheet", v: "Project & Cost Templates", w: "1.6fr", wide: true },
    { l: "Templates", v: t.length, w: ".5fr" },
    { l: "Source", v: "Frozen from delivered projects", w: "1.2fr" },
    { l: "Use", v: "Spawns a new Rev A draft", w: "1fr" }
  ]) + card({
    title: "Library", pad: false,
    body: `<table class="tbl"><thead><tr><th>Template</th><th>Business unit</th><th>Category</th>
      <th class="num">Lines</th><th class="num">Overhead</th><th class="num">Profit</th><th>Created</th><th class="no-print"></th></tr></thead>
      <tbody>${t.length ? t.map(x => `<tr>
        <td><div class="cell"><div style="font-weight:500">${esc(x.name)}</div>
          <div style="font-size:11px;color:var(--ink-3)">${esc(x.note)}</div></div></td>
        <td><div class="cell" style="color:var(--ink-2);font-size:12px">${esc(x.bu)}</div></td>
        <td><div class="cell" style="color:var(--ink-2);font-size:12px">${esc(x.category)}</div></td>
        <td class="num"><span class="calc">${count(x)}</span></td>
        <td class="num"><span class="calc">${x.markup.overheadPct}%</span></td>
        <td class="num"><span class="calc">${x.markup.profitPct}%</span></td>
        <td><div class="cell" style="font-size:11.5px;color:var(--ink-3)">${dstr(x.ts)} · ${esc(x.by)}</div></td>
        <td class="no-print"><div class="cell row" style="gap:5px">
          <button class="btn sm primary" data-act="useTemplate" data-id="${x.id}">Use</button>
          ${can.admin ? `<button class="icon-btn" style="width:24px;height:24px" data-act="delTemplate" data-id="${x.id}" title="Delete">${icon("trash", 12)}</button>` : ""}
        </div></td></tr>`).join("")
      : `<tr><td colspan="8">${emptyBox("clipboard", "No templates yet",
        "Open a project and choose <b>Save as template</b> to reuse its full cost structure on the next enquiry.")}</td></tr>`}
      </tbody></table>`
  });
}

/* --------------------------------- AUDIT --------------------------------- */
function viewAudit() {
  const rows = S.db.audit.filter(a => !S.query || (a.user + a.entity + a.field + a.next).toLowerCase().includes(S.query.toLowerCase()));
  return tb([
    { l: "Sheet", v: "Audit Trail & Activity Log", w: "1.6fr", wide: true },
    { l: "Entries", v: S.db.audit.length, w: ".5fr" },
    { l: "Retention", v: "Last 400 events", w: ".8fr" },
    { l: "Captured", v: "User · Time · Before · After", w: "1.2fr" }
  ]) + card({
    title: "Activity", pad: false,
    right: `<button class="btn sm" data-act="exportProjects">${icon("download", 12)} Export JSON</button>`,
    body: `<table class="tbl"><thead><tr><th style="width:150px">When</th><th style="width:150px">User</th>
      <th style="width:130px">Role</th><th style="width:175px">Entity</th><th>Field</th>
      <th style="width:150px">Before</th><th style="width:150px">After</th></tr></thead>
      <tbody>${rows.length ? rows.map(a => `<tr>
        <td><div class="cell mono" style="font-size:11.5px;color:var(--ink-3)">${tstr(a.ts)}</div></td>
        <td><div class="cell">${esc(a.user)}</div></td>
        <td><div class="cell"><span class="chip">${esc(a.role)}</span></div></td>
        <td><div class="cell mono" style="font-size:11.5px">${esc(a.entity)}</div></td>
        <td><div class="cell">${esc(a.field)}</div></td>
        <td><div class="cell mono" style="font-size:11.5px;color:var(--ink-3)">${esc(a.prev || "—")}</div></td>
        <td><div class="cell mono" style="font-size:11.5px;color:var(--teal)">${esc(a.next || "—")}</div></td></tr>`).join("")
      : `<tr><td colspan="7">${emptyBox("history", "Nothing logged yet", "Every edit to a project or a master table is recorded here.")}</td></tr>`}
      </tbody></table>`
  });
}

/* --------------------------------- ACCESS -------------------------------- */
function viewAccess() {
  const perms = [
    ["Cost modules", r => r.modules === "all" ? "All ten" : (r.modules.length ? r.modules.map(m => MOD_MAP[m].short).join(", ") : "None")],
    ["Master data", r => r.masters ? "Edit" : "Read"], ["Approve", r => r.approve ? "Yes" : "No"],
    ["Export", r => r.export ? "Yes" : "No"], ["Administer", r => r.admin ? "Yes" : "No"]
  ];
  return tb([
    { l: "Sheet", v: "Roles & Access Control", w: "1.5fr", wide: true },
    { l: "Signed in as", v: S.user, w: "1fr" }, { l: "Active role", v: S.role, w: "1fr" },
    { l: "Roles defined", v: Object.keys(S.cfg.roles).length, w: ".6fr" }
  ]) + `<div class="grid" style="grid-template-columns:1fr 300px">
    ${card({
    title: "Permission Matrix", pad: false,
    body: `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Role</th>${perms.map(p => `<th>${p[0]}</th>`).join("")}</tr></thead>
      <tbody>${Object.entries(S.cfg.roles).map(([r, v]) => `<tr${r === S.role ? ` style="background:var(--teal-soft)"` : ""}>
        <td><div class="cell" style="font-weight:${r === S.role ? 600 : 400}">${esc(r)}
          ${r === S.role ? `<span class="chip teal" style="margin-left:8px">active</span>` : ""}</div></td>
        ${perms.map(p => `<td><div class="cell" style="font-size:12px;color:var(--ink-2)">${esc(p[1](v))}</div></td>`).join("")}
      </tr>`).join("")}</tbody></table></div>`
  })}
    ${card({
    title: "Session",
    body: `<div class="grid" style="gap:11px">
      <div class="field"><label>Signed in as</label><input class="inp" value="${esc(S.user)}" data-act="setUser"></div>
      <div class="field"><label>Act as role</label><select class="inp" data-act="setRole">${opts(Object.keys(S.cfg.roles), S.role)}</select></div>
      <div style="font-size:11.5px;color:var(--ink-3);line-height:1.55">Switching role immediately changes what can be edited,
        approved and exported. Every action stays attributed to the signed-in name in the audit trail.</div>
      <div style="padding:9px 11px;background:var(--surface-2);border:1px solid var(--line);border-radius:4px;font-size:11.5px;line-height:1.55">
        <b>Working data.</b> Edits are held in this browser. Export JSON from Masters or Audit to write them back into
        <span class="mono">data/</span> and commit as the new baseline.</div>
      <button class="btn" data-act="reset">${icon("rotate", 12)} Reset to the JSON baseline</button>`
  })}
  </div>` + brandingCard();
}

/* ------------------------------- BRANDING -------------------------------- */
function brandingCard() {
  const b = S.cfg.brand || (S.cfg.brand = {}), c = S.cfg.company;
  const fields = [["name", "Company name"], ["short", "Short name"], ["product", "Product name"], ["tagline", "Tagline"]];
  return card({
    title: "Branding & Identity",
    right: `<button class="btn sm" data-act="exportConfig">${icon("download", 12)} Export config.json</button>`,
    style: "margin-top:12px",
    body: `<div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <div class="eyebrow" style="margin-bottom:6px">Mark in use</div>
        <div class="brand-box">${brandHTML(c.product)}</div>
        <div class="row" style="margin-top:10px;flex-wrap:wrap">
          <button class="btn sm" data-act="pickLogo" data-k="logo">${icon("upload", 12)} Upload logo</button>
          <button class="btn sm" data-act="pickLogo" data-k="logoDark">${icon("upload", 12)} Dark variant</button>
          ${b.logo ? `<button class="btn sm" data-act="clearLogo" data-k="logo">Remove</button>` : ""}
          ${b.logoDark ? `<button class="btn sm" data-act="clearLogo" data-k="logoDark">Remove dark</button>` : ""}
        </div>
        <input type="file" id="logoInput" accept="image/png,image/svg+xml,image/jpeg,image/webp" style="display:none" data-act="logoFile" data-k="logo">
        <input type="file" id="logoDarkInput" accept="image/png,image/svg+xml,image/jpeg,image/webp" style="display:none" data-act="logoFile" data-k="logoDark">
        <div style="margin-top:11px;font-size:11px;color:var(--ink-3);line-height:1.6">
          PNG or SVG, ideally under 100 KB. The file is embedded into the configuration as a data URI, so it travels with
          <span class="mono">config.json</span> and needs no separate asset. One upload drives the sidebar, the lock screen
          and the printed letterhead. Upload a light-on-dark version if your mark disappears against the dark theme.</div>
      </div>
      <div class="grid" style="gap:10px;align-content:start">
        ${fields.map(([k, l]) => `<div class="field"><label>${esc(l)}</label>
          <input class="inp" value="${esc(c[k] || "")}" data-act="cfield" data-k="${k}"></div>`).join("")}
        <div style="font-size:11px;color:var(--ink-3);line-height:1.6">These appear on the lock screen, the sidebar and every
          printed document. Export the configuration afterwards and commit it so the whole team picks it up.</div>
      </div>
    </div>`
  });
}

/* --------------------------------- GUIDE --------------------------------- */
function viewGuide() {
  const step = (n, t, b) => `<div style="display:grid;grid-template-columns:26px 1fr;gap:11px;margin-bottom:13px">
    <div class="mono" style="font-size:11px;color:var(--teal);padding-top:2px">${String(n).padStart(2, "0")}</div>
    <div><b style="font-size:13px">${t}</b><div style="font-size:12.5px;color:var(--ink-2);line-height:1.6;margin-top:3px">${b}</div></div></div>`;

  const formula = [
    ["1", "Each module sums its own lines", "Σ lines"],
    ["2", "Material picks up landed charges — freight, duty, landing. GST is shown but excluded, being recoverable", "× (1 + f + d + l)"],
    ["3", "Site cost picks up its contingency", "× (1 + s)"],
    ["4", "Commercial heads on a percentage basis apply to the eight modules before them", "× base"],
    ["5", "Direct cost", "Σ of the nine modules", 1],
    ["6", "Overheads recover the plant", "direct × OH%"],
    ["7", "Contingency sits on top of both", "(direct + OH) × C%"],
    ["8", "Total cost", "direct + OH + contingency", 1],
    ["9", "Profit is a mark-up on cost, not a discount off price", "total × M%"],
    ["10", "Selling price per unit", "total + profit", 1],
    ["11", "Order value", "selling × quantity", 1],
    ["12", "Gross margin / net margin", "(sell − direct) ÷ sell  /  profit ÷ sell"]
  ].map(r => `<div class="${r[3] ? "tot" : ""}"><span class="n">${r[0]}</span><span>${r[1]}</span><span class="eq">${r[2]}</span></div>`).join("");

  const modTable = MODULES.map(m => `<tr>
    <td><div class="cell row" style="gap:8px"><span style="color:${BUCKET_COLOR[m.key]}">${icon(m.icon, 14)}</span>
      <b>${esc(m.label)}</b></div></td>
    <td><div class="cell" style="font-size:12px;color:var(--ink-2)">${esc(m.note)}</div></td></tr>`).join("");

  return tb([
    { l: "Sheet", v: "How to use this platform", w: "1.7fr", wide: true },
    { l: "Audience", v: "Cost engineers · PM · Sales · Finance", w: "1.3fr" },
    { l: "Time to first quote", v: "About 20 minutes", w: ".9fr" },
    { l: "Version", v: "1.0", w: ".4fr" }
  ]) + `<div class="guide">

  ${card({
    title: "Start here", style: "margin-bottom:12px",
    body: `<p>Everything is organised around a <b>project</b> — one machine, one customer, one revision. You build its
      cost from ten modules, the platform rolls them up, and you decide the mark-up. Nothing is saved to a server;
      your work stays in this browser until you export it.</p>
      ${step(1, "Open something that already exists", `Go to <b>Projects</b> and open one of the seeded jobs. Look at
        <b>Cost summary</b> first — the stack-up on the left is the whole story of the price in one picture.`)}
      ${step(2, "Make your own", `<b>Projects → New project</b>. Give it a name and a customer. If it resembles work you
        have done before, pick a <b>template</b> in the "start from" box and the entire cost structure is copied in.`)}
      ${step(3, "Fill the modules", `<b>Cost builder</b> holds ten tabs. Start with <b>Material</b> — type the lines, or
        paste the BOM straight out of Excel with <b>Import</b>. Every tab shows its running total in the tab itself.`)}
      ${step(4, "Set the price", `<b>Cost summary</b>. Overheads and contingency are usually left at the plant defaults;
        the mark-up is your decision. If the customer has already named a number, put it in <b>Price to win</b> and the
        platform tells you what margin that leaves.`)}
      ${step(5, "Send it for approval", `<b>Project record → Submit for approval</b>. The approver and the margin floor
        are set automatically by the order value.`)}
      ${step(6, "Issue the documents", `<b>Reports</b> — internal cost sheet for the file, customer cost sheet and
        quotation summary for the customer. Print to PDF, or export to Excel.`)}`
  })}

  ${card({
    title: "How the number is built", style: "margin-bottom:12px",
    right: `<span class="eyebrow">The order never changes</span>`,
    body: `<p>Every figure in the platform comes out of this sequence. It is worth knowing, because it is what you will be
      asked to defend in a review.</p><div class="formula">${formula}</div>
      <p style="margin-top:11px"><b>Two things people trip on.</b> Profit is a mark-up <i>on cost</i>, so 20% mark-up is not a
      20% margin — it is about 16.7%. And AMC is never inside the selling price; it is quoted on its own line, because
      customers buy it separately.</p>`
  })}

  ${card({
    title: "The ten modules", pad: false, style: "margin-bottom:12px",
    body: `<table class="tbl"><thead><tr><th style="width:210px">Module</th><th>What belongs in it</th></tr></thead>
      <tbody>${modTable}</tbody></table>`
  })}

  <div class="grid" style="grid-template-columns:1fr 1fr;margin-bottom:12px">
    ${card({
    title: "Entering lines quickly",
    body: `<ul>
      <li><b>Paste from Excel.</b> <b>Import</b> on any module takes a tab-separated paste or a CSV. Columns are matched
        to the module automatically and you can correct the mapping before anything is written.</li>
      <li><b>Move without the mouse.</b> <span class="kbd">↑</span> <span class="kbd">↓</span> and
        <span class="kbd">Enter</span> walk down a column; <span class="kbd">Ctrl</span>+<span class="kbd">D</span>
        copies the cell above.</li>
      <li><b>Let the masters fill the rates.</b> Choosing a process or a resource pulls its rate in automatically. Type
        over it when a job is genuinely different — the master is a default, not a rule.</li>
      <li><b>Duplicate rather than retype.</b> The copy icon clones one row; tick several and use the bulk bar to
        duplicate or delete them together.</li>
      <li><b>Sort and filter long modules.</b> Click any column header to sort — clicking Amount twice puts the biggest
        lines on top. The filter box appears once a module passes six lines.</li>
      <li><b>Watch the amber dots.</b> A line that computes to nothing is flagged in the row and counted in the module
        footer as <b>unpriced</b> — that is the classic missed enclosure or forgotten freight.</li>
      <li><b>Deleting is reversible.</b> Every deletion, single or bulk, offers <b>Undo</b> for a few seconds.</li>
    </ul>`
  })}
    ${card({
    title: "Reading the cost summary",
    body: `<ul>
      <li><b>The stack-up</b> is drawn to scale — each band's height is its share of the selling price, and the figures
        down the right are the running total, the way a dimension chain reads on a drawing.</li>
      <li><b>Cost drivers</b> lists the twenty biggest lines across all modules. If the top five are 60% of the cost,
        those are the five quotations worth chasing before you commit to a price.</li>
      <li><b>Margin sensitivity</b> holds the price and swings each driver by a realistic amount. Anything that turns red
        would push the job below its approval floor — firm those up with a vendor quotation first.</li>
      <li><b>Price to win</b> works backwards: enter the number the customer needs and it returns the mark-up and margin
        that implies. <b>Apply mark-up</b> commits it.</li>
    </ul>`
  })}
  </div>

  ${card({
    title: "The item master — one price list behind every quote", style: "margin-bottom:12px",
    body: `<p><b>Master data → Item Master</b> is the catalogue of TEAL stock codes. Each record carries the description,
      specification, category, unit of measure, price and currency, preferred vendor, lead time, MOQ, HSN and the date the
      price was last confirmed. Maintain the price once, and every estimate built afterwards uses it.</p>
      <ul>
        <li><b>On a BOM line</b>, type into the <b>Stock code</b> cell — it is a live typeahead over the catalogue — or use
          the magnifier to browse. The description, specification, UOM, price, currency and vendor fill themselves. Only
          the quantity is yours to enter.</li>
        <li><b>Add several at once</b> with <b>Catalogue</b> in the module header: search or filter by category, tick what
          you need, and they arrive as new lines.</li>
        <li><b>Importing a BOM that carries stock codes</b> prices itself. The import preview tells you how many lines
          matched before anything is written; anything your file supplies explicitly still wins over the catalogue.</li>
        <li><b>Loading the catalogue itself</b> — <b>Import CSV</b> on the Item Master takes a spreadsheet export.
          Column names are matched automatically and can be corrected before import.</li>
        <li><b>Drift is visible.</b> A line priced away from the catalogue is marked, and <b>Re-price</b> pulls the whole
          BOM back to current prices in one action, with Undo.</li>
        <li><b>Stale prices are flagged</b> once a record passes ${STALE_DAYS} days, in the catalogue and on any line using it.</li>
        <li><b>Before changing a price</b>, the browser shows how many projects consume that code.</li>
      </ul>
      <p>A line with no stock code is not wrong — one-off fabrication belongs in free text. But its price is nobody's
      responsibility to keep current, which is what the <b>Catalogue Discipline</b> panel on the Material module measures.</p>`
  })}

  <div class="grid" style="grid-template-columns:1fr 1fr;margin-bottom:12px">
    ${card({
    title: "Approvals, revisions and roles",
    body: `<ul>
      <li><b>Approval floors</b> come from the order value band in the master data. The summary and the project record
        both tell you the approver and whether you clear the floor.</li>
      <li><b>Draft → Submitted → Approved</b>. An approved project locks; only someone with approval rights can reopen it.</li>
      <li><b>Freeze a revision</b> before every issue to the customer. It stores a full cost snapshot and advances the
        letter. <b>Version comparison</b> then shows exactly which heads moved between Rev B and Rev C — the question you
        always get asked.</li>
      <li><b>Roles</b> change what can be edited, approved and exported. Switching role is instant; every action stays
        attributed to the signed-in name in the audit trail.</li>
    </ul>`
  })}
    ${card({
    title: "Master data",
    body: `<ul>
      <li>Eleven tables: machine hour rates, labour, engineering, material, vendors, customers, currency, tax, freight,
        plants and the approval matrix.</li>
      <li>A change flows into <b>every</b> calculation immediately. Frozen revisions keep the rates they were costed at.</li>
      <li>Revise the currency table whenever the rupee moves — imported content is a real exposure and the exception
        panel flags any project where it exceeds a third of the material value.</li>
      <li>Only Admin, Procurement and Finance roles can edit masters.</li>
    </ul>`
  })}
  </div>

  ${card({
    title: "Saving, sharing and publishing", style: "margin-bottom:12px",
    body: `<p>Your edits live in this browser. That is deliberate — it means anyone can open the published site and work
      without an account — but it also means <b>your projects are not automatically visible to anyone else</b>.</p>
      <ul>
        <li><b>To share your work</b>, use <b>Audit trail → Export JSON</b> and <b>Master data → Export JSON</b>. Replace the
          files in <code>data/</code>, commit, and the whole team starts from your version.</li>
        <li><b>To back up</b>, do the same and keep the files. There is no other copy.</li>
        <li><b>To start fresh</b>, <b>Roles &amp; access → Reset to the JSON baseline</b> discards local edits.</li>
        <li><b>To protect the site</b>, encrypt the data with <code>encrypt.html</code>. After that the platform will not
          open without the passphrase, and your local working copy is encrypted too.</li>
      </ul>
      <p>When several people need to edit the same live figures at the same time, this pattern has reached its limit and
      the data needs to move to a real database behind a login.</p>`
  })}

  ${card({
    title: "Shortcuts", pad: false,
    body: `<table class="tbl"><tbody>
      ${[["<span class='kbd'>Ctrl</span> / <span class='kbd'>⌘</span> + <span class='kbd'>K</span>", "Command palette — jump to any project, screen, module or action"],
        ["<span class='kbd'>↑</span> <span class='kbd'>↓</span> <span class='kbd'>Enter</span>", "Move down a column in any costing grid"],
        ["<span class='kbd'>Ctrl</span> / <span class='kbd'>⌘</span> + <span class='kbd'>D</span>", "Fill down from the cell above"],
        ["<span class='kbd'>Esc</span>", "Close a dialog, the exception panel or the palette"],
        ["<span class='kbd'>Ctrl</span> / <span class='kbd'>⌘</span> + <span class='kbd'>P</span>", "Print the current sheet — screen furniture is removed and a letterhead added"]]
        .map(r => `<tr><td style="width:230px"><div class="cell">${r[0]}</div></td>
          <td><div class="cell" style="color:var(--ink-2)">${r[1]}</div></td></tr>`).join("")}
    </tbody></table>`
  })}
  </div>`;
}

/* ------------------------------ EXCEPTIONS ------------------------------- */
const SEV_COLOR = { high: "var(--signal)", med: "var(--amber)", low: "var(--ink-3)" };
function exceptions() {
  const out = [];
  S.db.projects.forEach(p => {
    const c = CALCS[p.id]; if (!c) return;
    const f = approvalFloor(c.orderValue);
    if (c.direct > 0 && c.netMargin * 100 < f.minMargin)
      out.push({ id: p.id, sev: "high", kind: "Margin", text: `${p.code} — net margin ${pct(c.netMargin, 1)} sits below the ${f.minMargin}% floor for ${f.band}` });
    if (["Submitted", "Under Review"].includes(p.status)) {
      const days = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / 864e5);
      if (days >= 4) out.push({ id: p.id, sev: "med", kind: "Approval", text: `${p.code} — waiting ${days} days on ${f.approver}` });
    }
    const mat = c.lines.material || [], tot = mat.reduce((s, r) => s + r._amt, 0);
    if (tot > 0) {
      const byV = {};
      mat.forEach(r => { const k = r.vendor || "Unassigned"; byV[k] = (byV[k] || 0) + r._amt; });
      const top = Object.entries(byV).sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] / tot > .45) out.push({ id: p.id, sev: "med", kind: "Supply", text: `${p.code} — ${top[0]} carries ${pct(top[1] / tot, 0)} of material value` });
      const fx = mat.filter(r => (r.cur || "INR") !== "INR").reduce((s, r) => s + r._amt, 0) / tot;
      if (fx > .35) out.push({ id: p.id, sev: "low", kind: "FX", text: `${p.code} — ${pct(fx, 0)} of material is priced in foreign currency` });
    }
    if (c.direct === 0 && p.status === "Draft") out.push({ id: p.id, sev: "low", kind: "Empty", text: `${p.code} — no cost lines entered yet` });
    else {
      const blanks = EQUIP_KEYS.reduce((n, k) => n + (c.lines[k] || []).filter(r => !(r._amt > 0)).length, 0);
      if (blanks > 0) out.push({
        id: p.id, sev: p.status === "Draft" ? "low" : "med", kind: "Unpriced",
        text: `${p.code} — ${blanks} line${blanks > 1 ? "s" : ""} carry no value and may be an omission`
      });
    }
  });
  const rank = { high: 0, med: 1, low: 2 };
  return out.sort((a, b) => rank[a.sev] - rank[b.sev]);
}
function exceptionsHTML() {
  const items = exceptions();
  return `<div class="pop">
    <div class="pop-head"><h3 style="margin:0;font-family:var(--cond);font-size:12px;font-weight:700;letter-spacing:.11em;text-transform:uppercase">Exceptions</h3>
      <span class="eyebrow">${items.length} open</span></div>
    ${items.length ? items.map(x => `<div class="pop-item" data-act="open" data-id="${x.id}">
      <i class="sev" style="background:${SEV_COLOR[x.sev]}"></i>
      <div style="min-width:0"><span class="eyebrow" style="display:block;margin-bottom:2px">${esc(x.kind)}</span>${esc(x.text)}</div>
    </div>`).join("")
      : `<div class="empty" style="padding:26px 18px">${icon("check", 19)}<h4>Nothing to action</h4>
         <p style="margin-bottom:0">Margins clear their floors and no approval is overdue.</p></div>`}
  </div>`;
}

/* --------------------------------- IMPORT -------------------------------- */
function parseDelimited(text) {
  const t = String(text || "").replace(/\r/g, "").trim();
  if (!t) return [];
  const first = t.split("\n")[0];
  const delim = (first.match(/\t/g) || []).length >= (first.match(/,/g) || []).length ? "\t" : ",";
  const rows = []; let cur = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { cur.push(cell); cell = ""; }
    else if (ch === "\n") { cur.push(cell); rows.push(cur); cur = []; cell = ""; }
    else cell += ch;
  }
  cur.push(cell); rows.push(cur);
  return rows.filter(r => r.some(c => String(c).trim() !== ""));
}
function autoMap(headers, cols) {
  const norm = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const H = headers.map(norm), m = {};
  cols.forEach(c => {
    const label = norm(c.l), key = norm(c.k);
    let i = H.findIndex(h => h === label || h === key);
    if (i < 0) i = H.findIndex(h => h.length > 2 && (h.includes(key) || key.includes(h)));
    if (i < 0) i = H.findIndex(h => h.length > 3 && (h.includes(label) || label.includes(h)));
    m[c.k] = i;
  });
  return m;
}
/* The import engine serves both a costing module and a master table. */
function importTarget() {
  if (S.imp && S.imp.master) {
    const spec = MASTER_SPEC.find(x => x.k === S.imp.master);
    return { isMaster: true, key: spec.k, label: spec.l, cols: spec.cols, blank: spec.blank };
  }
  const mod = MOD_MAP[S.tab];
  return { isMaster: false, key: mod.key, label: mod.label, cols: mod.cols, blank: mod.blank, mod };
}

function importBuild() {
  const tgt = importTarget(), data = parseDelimited(S.imp.text);
  if (!data.length) return { heads: [], built: [], tgt, matched: 0 };
  const heads = S.imp.header ? data[0].map(h => String(h).trim()) : data[0].map((_, i) => `Column ${i + 1}`);
  if (!S.imp.map) S.imp.map = autoMap(heads, tgt.cols);
  let matched = 0;
  const built = data.slice(S.imp.header ? 1 : 0).map(r => {
    const row = tgt.blank();
    const supplied = {};
    tgt.cols.forEach(c => {
      const i = S.imp.map[c.k];
      if (i >= 0 && r[i] != null && String(r[i]).trim() !== "") {
        const raw = String(r[i]).trim();
        row[c.k] = c.t === "num" ? N(raw.replace(/[^0-9.\-]/g, "")) : raw;
        supplied[c.k] = true;
      }
    });
    /* A BOM carrying TEAL stock codes resolves itself against the item master:
       anything the file did not supply is taken from the catalogue. */
    if (!tgt.isMaster && tgt.cols.some(c => c.t === "item")) {
      const it = itemByCode(row.code);
      if (it) {
        matched++;
        const keep = {};
        ["item", "spec", "cls", "vendor", "uom", "price", "cur"].forEach(k => { if (supplied[k]) keep[k] = row[k]; });
        applyItem(row, it);
        Object.keys(keep).forEach(k => { row[k] = keep[k]; });
      }
    }
    if (!tgt.isMaster) row._amt = tgt.mod.calc(row, { directBase: 0 });
    return row;
  });
  return { heads, built, tgt, matched };
}
function importModalHTML() {
  const p = activeProject(), { heads, built, tgt, matched } = importBuild();
  const mod = tgt;
  const existing = tgt.isMaster ? (S.db.masters[tgt.key] || []).length : ((activeCalc().lines[tgt.key]) || []).length;
  const value = built.reduce((s, r) => s + (r._amt || 0), 0);
  const unmatched = heads.length ? tgt.cols.filter(c => S.imp.map[c.k] < 0).map(c => c.l) : [];
  return modalShell({
    title: `Import into ${tgt.label}`, width: "880px",
    body: `<div class="grid" style="gap:13px">
      <div>
        <div class="spread" style="margin-bottom:6px">
          <span class="eyebrow">Paste from Excel, or load a CSV</span>
          <div class="row" style="gap:7px">
            <label class="row" style="gap:5px;font-size:11.5px;cursor:pointer">
              <input type="checkbox"${S.imp.header ? " checked" : ""} data-act="impHeader"> First row is a header</label>
            <button class="btn sm" data-act="impFile">${icon("upload", 12)} Choose file</button>
            <input type="file" accept=".csv,.tsv,.txt" style="display:none" id="impFileInput">
          </div>
        </div>
        <textarea class="inp mono" rows="5" data-act="impText" style="font-size:11.5px;resize:vertical"
          placeholder="Item&#9;Qty&#9;Unit price&#10;Fibre laser source 30W&#9;2&#9;9800">${esc(S.imp.text)}</textarea>
      </div>
      ${heads.length ? `<div>
        <div class="eyebrow" style="margin-bottom:6px">Column mapping</div>
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:2px 18px">
          ${mod.cols.map(c => `<div class="map-row">
            <span style="font-size:12px">${esc(c.l)}</span>${icon("right", 12)}
            <select class="inp" style="padding:3px 6px;font-size:11.5px" data-act="impMap" data-k="${c.k}">
              <option value="-1">— use default —</option>
              ${heads.map((h, i) => `<option value="${i}"${S.imp.map[c.k] === i ? " selected" : ""}>${esc(h)}</option>`).join("")}
            </select></div>`).join("")}
        </div>
        ${unmatched.length ? `<div class="row" style="margin-top:9px;font-size:11.5px;color:var(--ink-3)">
          <span style="color:var(--amber)">${icon("alert", 12)}</span>
          Not matched — ${esc(unmatched.join(", "))}. These take the module default and can be edited after import.</div>` : ""}
      </div>` : ""}
      ${built.length ? `<div>
        <div class="spread" style="margin-bottom:6px">
          <span class="eyebrow">Preview — first ${Math.min(5, built.length)} of ${built.length}</span>
          <div class="row" style="gap:7px">
            <label class="row" style="gap:5px;font-size:11.5px;cursor:pointer"><input type="radio" name="impmode"${S.imp.mode === "append" ? " checked" : ""} data-act="impMode" data-m="append"> Add to the existing ${existing}</label>
            <label class="row" style="gap:5px;font-size:11.5px;cursor:pointer"><input type="radio" name="impmode"${S.imp.mode === "replace" ? " checked" : ""} data-act="impMode" data-m="replace"> Replace everything</label>
          </div>
        </div>
        <div class="tbl-wrap" style="border:1px solid var(--line);border-radius:4px"><table class="tbl">
          <thead><tr>${tgt.cols.map(c => `<th class="${c.t === "num" ? "num" : ""}">${esc(c.l)}</th>`).join("")}
            ${tgt.isMaster ? "" : `<th class="num">Amount</th>`}</tr></thead>
          <tbody>${built.slice(0, 5).map(r => `<tr>
            ${mod.cols.map(c => `<td class="${c.t === "num" ? "num" : ""}"><div class="cell${c.t === "num" ? " mono" : ""}" style="font-size:12px">${esc(r[c.k])}</div></td>`).join("")}
            ${tgt.isMaster ? "" : `<td class="num"><span class="calc">${fmt(r._amt || 0, p.currency)}</span></td>`}</tr>`).join("")}</tbody>
        </table></div>
      </div>` : ""}
    </div>`,
    footer: `<span style="margin-right:auto;font-size:11.5px;color:var(--ink-3)">
        ${built.length
        ? `${built.length} ${tgt.isMaster ? "records" : "lines"}${tgt.isMaster ? "" : " · " + fmt(value, p.currency)}` +
        (!tgt.isMaster && tgt.cols.some(c => c.t === "item")
          ? ` · <b style="color:${matched ? "var(--green)" : "var(--amber)"}">${matched} matched a stock code</b>` : "")
        : "Nothing parsed yet"}</span>
      <button class="btn" data-act="closeModal">Cancel</button>
      <button class="btn primary" data-act="doImport"${built.length ? "" : " disabled"}>${icon("upload", 13)} Import ${built.length || ""} ${tgt.isMaster ? "records" : "lines"}</button>`
  });
}

/* ---------------------------- CATALOGUE BROWSER --------------------------
   Opened either from a single cell (pick one code for that line) or from the
   module header (tick several and add them as new lines).
   ======================================================================== */
function catalogueModalHTML() {
  const st = S.cat, single = !!st.row;
  const cats = ["All"].concat(Array.from(new Set(ITEMS().map(i => i.cat))).sort());
  const q = (st.q || "").toLowerCase().trim();
  const rows = ITEMS().filter(i => {
    if (st.cat !== "All" && i.cat !== st.cat) return false;
    if (!q) return true;
    return (i.code + " " + i.name + " " + (i.spec || "") + " " + (i.vendor || "") + " " + (i.mpn || "")).toLowerCase().includes(q);
  });
  const cur = activeProject() ? activeProject().currency : S.currency;
  return modalShell({
    title: single ? "Pick a stock code" : "Add from the item master", width: "980px",
    body: `<div class="row" style="margin-bottom:11px;flex-wrap:wrap;gap:7px">
        <span class="gridq" style="flex:1;min-width:220px">${icon("search", 13)}
          <input style="width:100%" placeholder="Code, description, specification, vendor or MPN"
            value="${esc(st.q || "")}" data-act="catQ" autofocus></span>
        <select class="inp" style="width:170px" data-act="catCat">${opts(cats, st.cat)}</select>
        <span class="chip">${rows.length} of ${ITEMS().length}</span>
      </div>
      <div class="tbl-wrap" style="border:1px solid var(--line);border-radius:4px;max-height:46vh;overflow:auto">
        <table class="tbl"><thead><tr>
          ${single ? "" : `<th style="width:32px"></th>`}
          <th style="width:132px">Stock code</th><th>Description</th><th style="width:150px">Category</th>
          <th style="width:160px">Preferred vendor</th><th class="num" style="width:120px">Price</th>
          <th class="num" style="width:70px">Lead</th><th style="width:78px">Used in</th>
          ${single ? `<th style="width:70px"></th>` : ""}</tr></thead>
        <tbody>${rows.length ? rows.map(i => {
      const used = whereUsed(i.code).length, stale = isStale(i);
      return `<tr class="${st.pick.includes(i.code) ? "rowsel" : ""}">
            ${single ? "" : `<td><div class="cell" style="padding:6px 8px"><input type="checkbox" data-act="catPick"
              data-code="${esc(i.code)}"${st.pick.includes(i.code) ? " checked" : ""} aria-label="Select item"></div></td>`}
            <td><span class="calc mono" style="text-align:left;font-size:11.5px;color:var(--teal)">${esc(i.code)}</span></td>
            <td><div class="cell"><div>${esc(i.name)}</div>
              <div style="font-size:11px;color:var(--ink-3)">${esc(i.spec || "")}</div></div></td>
            <td><div class="cell" style="font-size:12px;color:var(--ink-2)">${esc(i.cat)}</div></td>
            <td><div class="cell" style="font-size:12px;color:var(--ink-2)">${esc(i.vendor || "—")}</div></td>
            <td class="num"><span class="calc" title="${stale ? "Price is " + priceAge(i) + " days old" : "Priced " + dstr(i.updated)}">
              ${stale ? `<span class="mk" style="color:var(--amber)">!</span>` : ""}${esc((i.cur === "INR" ? "₹" : i.cur === "USD" ? "$" : i.cur === "EUR" ? "€" : i.cur) + " " + N(i.price).toLocaleString("en-IN"))}</span></td>
            <td class="num"><span class="calc" style="color:var(--ink-3)">${esc(i.lead)}w</span></td>
            <td><div class="cell" style="font-size:11.5px;color:var(--ink-3)">${used ? used + " proj" : "—"}</div></td>
            ${single ? `<td><div class="cell"><button class="btn sm primary" data-act="catUse" data-code="${esc(i.code)}">Use</button></div></td>` : ""}
          </tr>`;
    }).join("") : `<tr><td colspan="9">${emptyBox("package", "Nothing matches",
      "Try a different term, or add the item in <b>Master data → Item Master</b>.")}</td></tr>`}</tbody></table>
      </div>
      ${single ? "" : `<div style="margin-top:11px;font-size:11.5px;color:var(--ink-3)">
        Ticked items are added as new lines at quantity 1, carrying description, specification, unit of measure,
        currency, price and preferred vendor from the catalogue.</div>`}`,
    footer: single
      ? `<button class="btn" data-act="closeModal">Cancel</button>`
      : `<span style="margin-right:auto;font-size:11.5px;color:var(--ink-3)">${st.pick.length} selected</span>
         <button class="btn" data-act="closeModal">Cancel</button>
         <button class="btn primary" data-act="catAdd"${st.pick.length ? "" : " disabled"}>${icon("plus", 13)} Add ${st.pick.length || ""} lines</button>`
  });
}

/* --------------------------------- MODALS -------------------------------- */
function modalShell(o) {
  return `<div class="modal-bg" data-act="modalBg">
    <div class="modal"${o.width ? ` style="max-width:${o.width}"` : ""}>
      <div class="card-head" style="position:sticky;top:0;z-index:3;border-bottom:1px solid var(--line)">
        <h3>${esc(o.title)}</h3>
        <button class="icon-btn" data-act="closeModal">${icon("x", 14)}</button></div>
      <div style="padding:15px">${o.body}</div>
      ${o.footer ? `<div style="padding:12px 15px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:8px;position:sticky;bottom:0;background:var(--surface)">${o.footer}</div>` : ""}
    </div></div>`;
}
function newProjectModalHTML() {
  const f = S.np, t = S.db.templates || [];
  const fld = (k, l, type, list) => `<div class="field"><label>${esc(l)}</label>
    ${list ? `<select class="inp" data-act="npf" data-k="${k}">${opts(list, f[k])}</select>`
      : `<input class="inp${type === "number" ? " mono" : ""}" type="${type || "text"}" value="${esc(f[k])}" data-act="npf" data-k="${k}">`}</div>`;
  return modalShell({
    title: "New project",
    body: `<div class="grid" style="grid-template-columns:1fr 1fr">
      <div style="grid-column:span 2"><div class="field"><label>Start from</label>
        <select class="inp" data-act="npTpl"><option value="">Blank project</option>
          ${t.map(x => `<option value="${x.id}"${f._tpl === x.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div></div>
      <div style="grid-column:span 2">${fld("name", "Project name")}</div>
      ${fld("code", "Project code")}
      ${fld("customer", "Customer", null, S.db.masters.customer.map(x => x.name))}
      ${fld("bu", "Business unit", null, S.cfg.businessUnits)}
      ${fld("category", "Product category", null, S.cfg.productCategories)}
      ${fld("machine", "Machine name")}
      ${fld("qty", "Quantity", "number")}
      ${fld("currency", "Currency", null, S.db.masters.currency.map(x => x.code))}
      ${fld("plant", "Plant", null, S.db.masters.plant.map(x => x.name))}
      ${fld("salesEngineer", "Sales engineer")}
      ${fld("delivery", "Delivery timeline")}
    </div>
    <div style="margin-top:13px;font-size:11.5px;color:var(--ink-3)">${f._tpl
        ? "The template's full cost structure, landed-cost basis and mark-up are copied in. Every line stays editable."
        : "The project opens at Rev A in Draft. Overheads default to the plant recovery rate and can be changed on the cost summary."}</div>`,
    footer: `<button class="btn" data-act="closeModal">Cancel</button>
      <button class="btn primary" data-act="createProject"${f.name.trim().length > 2 ? "" : " disabled"}>${icon("plus", 13)} Create project</button>`
  });
}

/* ---------------------------------- SHELL -------------------------------- */
function brandHTML(sub) {
  const b = S.cfg.brand || {};
  const src = (S.theme === "dark" && b.logoDark) ? b.logoDark : b.logo;
  if (src) return `<div class="mark"><img src="${esc(src)}" alt="TEAL" class="mark-img">
    ${sub ? `<div class="mark-text"><small>${esc(sub)}</small></div>` : ""}</div>`;
  return `<div class="mark">
    <div class="mark-glyph"><svg viewBox="0 0 24 24" width="19" height="19">
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12 2.2v19.6M2.2 12h19.6" stroke="currentColor" stroke-width=".9" opacity=".5"/>
      <path d="M12 12 L12 3.4 A8.6 8.6 0 0 1 20.6 12 Z" fill="currentColor" opacity=".92"/></svg></div>
    <div class="mark-text"><b>${esc(S.cfg.company.short)}</b><small>${esc(sub)}</small></div></div>`;
}

function railHTML() {
  const p = activeProject();
  const nav = [
    { g: "Portfolio", items: [{ k: "dashboard", l: "Dashboard", i: "dashboard" }, { k: "projects", l: "Projects", i: "folder" }] },
    ...(p ? [{
      g: p.code, items: [
        { k: "details", l: "Project record", i: "file" }, { k: "builder", l: "Cost builder", i: "calculator" },
        { k: "summary", l: "Cost summary", i: "layers" }, { k: "revisions", l: "Revisions", i: "history" },
        { k: "reports", l: "Reports", i: "printer" }]
    }] : []),
    {
      g: "Configuration", items: [
        { k: "masters", l: "Master data", i: "database" }, { k: "templates", l: "Templates", i: "clipboard" },
        { k: "audit", l: "Audit trail", i: "history" }, { k: "access", l: "Roles & access", i: "shield" },
        { k: "guide", l: "How to use", i: "file" }]
    }
  ];
  return `<div class="rail-head">${brandHTML(S.cfg.company.product)}</div>
    <nav class="nav">${nav.map(g => `<div class="nav-group"><div class="eyebrow">${esc(g.g)}</div>
      ${g.items.map(it => `<button class="nav-item${S.view === it.k ? " active" : ""}" data-act="nav" data-k="${it.k}">
        ${icon(it.i, 15)}<span class="lbl">${esc(it.l)}</span></button>`).join("")}</div>`).join("")}</nav>
    <div class="rail-foot">
      <button class="nav-item" data-act="collapse">${icon(S.collapsed ? "right" : "left", 15)}<span class="lbl">Collapse</span></button>
      <div class="row" style="padding:6px 9px;gap:6px">
        <span id="saveDot" style="width:6px;height:6px;border-radius:6px;background:var(--green);flex:0 0 6px"></span>
        <span class="lbl" id="saveTxt" style="font-size:11px;color:var(--ink-3)">All changes saved</span></div>
    </div>`;
}

function topbarHTML() {
  const p = activeProject(), n = exceptions().length;
  return `<div class="searchbox">${icon("search", 14)}
      <input placeholder="Search projects, customers, machines…" value="${esc(S.query)}" data-act="search" aria-label="Search">
      ${S.query ? `<button class="icon-btn" style="width:20px;height:20px;border:none" data-act="clearSearch" aria-label="Clear search">${icon("x", 12)}</button>`
        : `<span class="kbd" data-act="palette" style="cursor:pointer" title="Command palette">⌘K</span>`}</div>
    ${p ? `<div class="row" style="gap:7px;min-width:0">
      <span class="chip teal">${esc(p.code)}</span><span class="chip">Rev ${esc(p.rev)}</span>${statusChip(p.status)}
      <button class="btn ghost sm" data-act="closeProject" title="Close project">${icon("x", 12)}</button></div>` : ""}
    <div style="flex:1"></div>
    <button class="icon-btn" data-act="nav" data-k="guide" title="How to use this platform" aria-label="Help">${icon("file", 14)}</button>
    <button class="icon-btn" data-act="density" title="${S.density === "compact" ? "Comfortable rows" : "Compact rows"}"
      aria-label="Toggle row density">${icon("density", 14)}</button>
    ${CRYPTO_KEY ? `<button class="icon-btn" data-act="lock" title="Lock the platform" aria-label="Lock">${icon("lock", 14)}</button>` : ""}
    <div class="bell"><button class="icon-btn" data-act="toggleNotif" title="Exceptions">${icon("bell", 14)}
      ${n ? `<span class="badge">${n}</span>` : ""}</button></div>
    <select class="inp" style="width:78px;padding:4px 6px;font-size:12px" data-act="setCurrency" title="Reporting currency">
      ${opts(S.db.masters.currency.map(c => c.code), S.currency)}</select>
    <select class="inp" style="width:150px;padding:4px 6px;font-size:12px" data-act="setRole" title="Active role">
      ${opts(Object.keys(S.cfg.roles), S.role)}</select>
    <button class="icon-btn" data-act="theme" title="Switch theme" aria-label="Switch theme">${icon(S.theme === "light" ? "moon" : "sun", 14)}</button>`;
}

function letterheadHTML() {
  return `<div class="mark print-only letterhead">${brandHTML(S.cfg.company.tagline)}
    <div class="lh-meta"><div>${esc(S.cfg.company.name)}</div>
      <div>${esc(S.cfg.company.product)} · Confidential</div></div></div>`;
}

function sheetHTML() {
  const p = activeProject();
  const inProject = p && ["details", "builder", "summary", "revisions", "reports"].includes(S.view);
  let body = "";
  if (S.view === "dashboard") body = viewDashboard();
  else if (S.view === "projects") body = viewProjects();
  else if (S.view === "masters") body = viewMasters();
  else if (S.view === "templates") body = viewTemplates();
  else if (S.view === "audit") body = viewAudit();
  else if (S.view === "access") body = viewAccess();
  else if (S.view === "guide") body = viewGuide();
  else if (inProject) {
    const c = activeCalc();
    body = tb([
      { l: "Project", v: p.name, w: "2fr", wide: true },
      { l: "Customer", v: p.customer, w: "1.1fr" }, { l: "Machine", v: p.machine, w: "1fr" },
      { l: "Qty", v: p.qty, w: ".35fr" }, { l: "Rev", v: p.rev, w: ".35fr" },
      { l: "Order value", v: fmtC(c.orderValue, p.currency), w: ".9fr", live: "orderValueC" },
      { l: "Net margin", v: pct(c.netMargin, 1), w: ".7fr", live: "netMargin", color: c.netMargin < .15 ? "var(--signal)" : "var(--green)" }
    ]) + (S.view === "details" ? viewDetails() : S.view === "builder" ? viewBuilder()
      : S.view === "summary" ? viewSummary() : S.view === "revisions" ? viewRevisions() : viewReports());
  } else body = viewDashboard();
  return letterheadHTML() + `<div class="fadein">${body}</div>`;
}

/* Re-rendering a whole screen must not throw away where the user was. Scroll
   offset and the focused cell are captured and restored around every render. */
function focusSignature(el) {
  if (!el || !el.dataset || !el.dataset.act) return null;
  const d = el.dataset;
  return { a: d.act, mod: d.mod, row: d.row, k: d.k, sel: el.selectionStart };
}
function restoreFocus(f) {
  if (!f) return;
  let sel = `[data-act="${f.a}"]`;
  ["mod", "row", "k"].forEach(x => { if (f[x]) sel += `[data-${x}="${f[x]}"]`; });
  const el = $(sel);
  if (!el || !el.focus) return;
  el.focus();
  if (f.sel != null && el.setSelectionRange && el.type !== "number") {
    try { el.setSelectionRange(f.sel, f.sel); } catch (e) { }
  }
}
function render() {
  const app = $("#app");
  const prevSheet = $("#sheet");
  const scroll = prevSheet ? prevSheet.scrollTop : 0;
  const foc = focusSignature(document.activeElement);
  app.dataset.theme = S.theme;
  app.dataset.density = S.density;
  $("#rail").className = "rail" + (S.collapsed ? " collapsed" : "");
  $("#rail").innerHTML = railHTML();
  $("#topbar").innerHTML = topbarHTML();
  $("#sheet").innerHTML = sheetHTML();
  $("#sheet").scrollTop = scroll;
  restoreFocus(foc);
  $("#notif").innerHTML = S.notif ? exceptionsHTML() : "";
  $("#modal").innerHTML = S.modal === "new" ? newProjectModalHTML()
    : S.modal === "import" ? importModalHTML()
      : S.modal === "catalogue" ? catalogueModalHTML() : "";
}

let toastTimer = null;
function toast(msg, undoable) {
  const t = $("#toast");
  t.innerHTML = `<div class="toast">${icon("dot", 13)} ${esc(msg)}
    ${undoable ? `<button class="btn sm" data-act="undo" style="margin-left:6px;background:none;border-color:rgba(255,255,255,.35);color:inherit">Undo</button>` : ""}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.innerHTML = ""; if (undoable) S.undo = null; }, undoable ? 7000 : 2600);
}
/* Destructive actions stay reversible for a few seconds rather than asking
   "are you sure?" every time. */
function withUndo(label, restore) {
  S.undo = { restore };
  toast(label, true);
}

/* ---------------------------- COMMAND PALETTE ---------------------------- */
function paletteItems() {
  const items = [];
  const push = (sec, label, sub, run, kbd) => items.push({ sec, label, sub: sub || "", run, kbd: kbd || "" });
  const views = [["dashboard", "Dashboard"], ["projects", "Projects"], ["masters", "Master data"],
  ["templates", "Templates"], ["audit", "Audit trail"], ["access", "Roles & access"], ["guide", "How to use"]];
  views.forEach(([k, l]) => push("Go to", l, "", () => { S.view = k; render(); }));
  if (activeProject()) {
    [["details", "Project record"], ["builder", "Cost builder"], ["summary", "Cost summary"],
    ["revisions", "Revisions"], ["reports", "Reports"]]
      .forEach(([k, l]) => push("Current project", l, activeProject().code, () => { S.view = k; render(); }));
    MODULES.forEach(m => push("Cost module", m.label, "open in the builder",
      () => { S.tab = m.key; S.view = "builder"; render(); }));
  }
  S.db.projects.forEach(p => push("Projects", p.code + " — " + p.name, p.customer,
    () => { S.activeId = p.id; S.view = "summary"; render(); }));
  MASTER_SPEC.forEach(m => push("Master tables", m.l, "", () => { S.masterTab = m.k; S.view = "masters"; render(); }));
  push("Actions", "New project", "", () => ACT.newProject());
  push("Actions", "Switch theme", S.theme === "light" ? "to dark" : "to light", () => ACT.theme());
  push("Actions", "Switch density", S.density === "compact" ? "to comfortable" : "to compact", () => ACT.density());
  push("Actions", "Print current sheet", "", () => window.print());
  push("Actions", "Export masters as JSON", "", () => ACT.exportMasters());
  push("Actions", "Export projects as JSON", "", () => ACT.exportProjects());
  if (CRYPTO_KEY) push("Actions", "Lock the platform", "", () => ACT.lock());
  return items;
}
function paletteFiltered() {
  const q = (S.pal.q || "").toLowerCase().trim();
  const all = paletteItems();
  if (!q) return all.slice(0, 24);
  const terms = q.split(/\s+/);
  return all.filter(it => {
    const hay = (it.sec + " " + it.label + " " + it.sub).toLowerCase();
    return terms.every(t => hay.includes(t));
  }).slice(0, 40);
}
function paletteListHTML() {
  const list = paletteFiltered();
  if (!list.length) return `<div class="pal-empty">Nothing matches that.</div>`;
  let sec = "", out = "";
  list.forEach((it, i) => {
    if (it.sec !== sec) { sec = it.sec; out += `<div class="pal-sec eyebrow">${esc(sec)}</div>`; }
    out += `<div class="pal-item${i === S.pal.sel ? " sel" : ""}" data-act="palRun" data-i="${i}">
      <span>${esc(it.label)}</span>${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ""}
      ${i === S.pal.sel ? `<span class="k kbd">↵</span>` : ""}</div>`;
  });
  return out;
}
function paletteHTML() {
  return `<div class="pal-bg" data-act="palBg"><div class="pal">
    <div class="pal-in">${icon("search", 16)}
      <input id="palInput" data-act="palQ" placeholder="Jump to a project, screen or action…" value="${esc(S.pal.q || "")}" autocomplete="off">
      <span class="kbd">esc</span></div>
    <div class="pal-list" id="palList">${paletteListHTML()}</div>
    <div class="pal-foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> navigate</span>
      <span><span class="kbd">↵</span> open</span>
      <span style="margin-left:auto">Ctrl / ⌘ + K anywhere</span></div>
  </div></div>`;
}
function openPalette() {
  S.pal = { q: "", sel: 0 };
  $("#palette").innerHTML = paletteHTML();
  const inp = $("#palInput");
  setTimeout(() => inp && inp.focus(), 30);
}
function closePalette() { S.pal = null; $("#palette").innerHTML = ""; }
function palMove(d) {
  const n = paletteFiltered().length; if (!n) return;
  S.pal.sel = (S.pal.sel + d + n) % n;
  $("#palList").innerHTML = paletteListHTML();
  const sel = $(".pal-item.sel"); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "nearest" });
}
function palRun(i) {
  const list = paletteFiltered(); const it = list[i == null ? S.pal.sel : i];
  closePalette();
  if (it) it.run();
}

/* --------------------------------- ACTIONS ------------------------------- */
function touch(p) { p.updatedAt = nowISO(); }
function blankProject(o) {
  const d = S.cfg.defaults;
  return Object.assign({
    id: uid(), code: "", name: "", customer: (S.db.masters.customer[0] || {}).name || "",
    bu: S.cfg.businessUnits[0], category: S.cfg.productCategories[0],
    machine: "", qty: 1, rev: "A", currency: d.currency, salesEngineer: "", pm: S.user,
    plant: (S.db.masters.plant[0] || {}).name || "", delivery: "", status: "Draft", notes: "", attachments: [],
    lines: Object.fromEntries(MODULES.map(m => [m.key, []])),
    landed: Object.assign({}, d.landed), markup: Object.assign({}, d.markup),
    revisions: [], createdAt: nowISO(), updatedAt: nowISO()
  }, o);
}

const ACT = {
  nav: (ds) => {
    if (["details", "builder", "summary", "revisions", "reports"].includes(ds.k) && !activeProject()) {
      S.view = "projects"; toast("Open a project first.");
    } else S.view = ds.k;
    render();
  },
  open: (ds) => { S.activeId = ds.id; S.view = "summary"; S.notif = false; render(); },
  closeProject: () => { S.activeId = null; S.view = "projects"; render(); },
  collapse: () => { S.collapsed = !S.collapsed; saveUI(); render(); },
  theme: () => { S.theme = S.theme === "light" ? "dark" : "light"; saveUI(); render(); },
  density: () => { S.density = S.density === "compact" ? "comfortable" : "compact"; saveUI(); render(); },
  palette: () => openPalette(),
  palBg: (ds, e) => { if (e.target.classList.contains("pal-bg")) closePalette(); },
  palRun: (ds) => palRun(+ds.i),
  undo: () => {
    if (!S.undo) return;
    S.undo.restore(); S.undo = null;
    recalcAll(); render(); toast("Restored.");
  },
  pickLogo: (ds) => { const el = $("#" + (ds.k === "logoDark" ? "logoDarkInput" : "logoInput")); if (el) el.click(); },
  clearLogo: (ds) => {
    S.cfg.brand[ds.k] = ""; persist(); render(); toast("Logo removed.");
  },
  exportConfig: () => { downloadFile("config.json", JSON.stringify(S.cfg, null, 2)); toast("config.json downloaded."); },
  applyTarget: () => {
    const p = activeProject(), c = activeCalc();
    if (!p.target || !c.totalCost) return;
    const implied = ((p.target / c.totalCost) - 1) * 100;
    log(p.code, "Mark-up set from target price", p.markup.profitPct, implied.toFixed(1));
    p.markup.profitPct = Math.round(implied * 100) / 100; touch(p);
    recalcAll(); render();
    toast(implied < 0 ? "Target is below cost — mark-up is now negative." : `Mark-up set to ${p.markup.profitPct}% to meet the target.`);
  },
  toggleNotif: () => { S.notif = !S.notif; render(); },
  tab: (ds) => { S.tab = ds.mod; render(); $("#sheet").scrollTop = 0; },
  sort: (ds) => { S.sort = { k: ds.k, dir: S.sort.k === ds.k ? -S.sort.dir : -1 }; render(); },
  masterTab: (ds) => { S.masterTab = ds.k; render(); },
  report: (ds) => { S.reportKind = ds.k; render(); },
  print: () => window.print(),
  clearSearch: () => { S.query = ""; render(); },
  closeModal: () => { S.modal = null; render(); },
  modalBg: (ds, e) => { if (e.target.classList.contains("modal-bg")) { S.modal = null; render(); } },
  reset: () => { if (confirm("Discard local edits and reload the published baseline?")) resetToJSON(); },
  lock: () => { try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { } location.reload(); },
  exportMasters: () => { exportMastersJSON(); toast("masters.json downloaded."); },
  exportProjects: () => { exportProjectsJSON(); toast("projects.json downloaded."); },
  exportReport: () => {
    if (!CAN().export) return toast("Your role cannot export data.");
    if (["margin", "profitability"].includes(S.reportKind)) exportPortfolioCSV(S.reportKind);
    else exportProjectCSV();
    toast("Export downloaded.");
  },

  newProject: () => {
    S.np = {
      code: "", name: "", customer: (S.db.masters.customer[0] || {}).name || "", bu: S.cfg.businessUnits[3] || S.cfg.businessUnits[0],
      category: S.cfg.productCategories[0], machine: "", qty: 1, currency: S.cfg.defaults.currency,
      salesEngineer: "", delivery: "", plant: (S.db.masters.plant[0] || {}).name || "", _tpl: ""
    };
    S.modal = "new"; render();
  },
  createProject: () => {
    const f = S.np, t = (S.db.templates || []).find(x => x.id === f._tpl);
    const p = blankProject({
      code: f.code || S.cfg.defaults.codePrefix + Math.floor(500 + Math.random() * 400),
      name: f.name, customer: f.customer, bu: f.bu, category: f.category, machine: f.machine,
      qty: N(f.qty) || 1, currency: f.currency, salesEngineer: f.salesEngineer, delivery: f.delivery, plant: f.plant
    });
    if (t) { p.lines = JSON.parse(JSON.stringify(t.lines)); p.markup = { ...t.markup }; p.landed = { ...t.landed }; }
    S.db.projects.unshift(p); S.activeId = p.id; S.view = t ? "summary" : "details"; S.modal = null;
    log(p.code, "Project created", "—", t ? `${p.name} (from template ${t.name})` : p.name);
    recalcAll(); render(); toast(t ? `Created from ${t.name}. Review the cost summary.` : "Project created.");
  },
  dup: (ds) => {
    const src = S.db.projects.find(x => x.id === ds.id);
    const c = Object.assign(JSON.parse(JSON.stringify(src)), {
      id: uid(), code: src.code + "-C", name: src.name + " (copy)", rev: "A", status: "Draft",
      revisions: [], createdAt: nowISO(), updatedAt: nowISO()
    });
    S.db.projects.unshift(c); log(c.code, "Project duplicated", src.code, c.code);
    recalcAll(); render(); toast("Project duplicated as a fresh Rev A draft.");
  },
  del: (ds) => {
    if (!CAN().admin) return toast("Only an administrator can delete a project.");
    const idx = S.db.projects.findIndex(x => x.id === ds.id);
    const p = S.db.projects[idx], wasActive = S.activeId === ds.id;
    S.db.projects.splice(idx, 1);
    if (wasActive) { S.activeId = null; S.view = "projects"; }
    log(p.code, "Project deleted", p.name, "—"); recalcAll(); render();
    withUndo(`${p.code} deleted.`, () => {
      S.db.projects.splice(idx, 0, p);
      if (wasActive) S.activeId = p.id;
      log(p.code, "Deletion undone", "—", p.name);
    });
  },
  status: (ds) => {
    const p = activeProject();
    log(p.code, "Status", p.status, ds.s); p.status = ds.s; touch(p);
    recalcAll(); render(); toast(`Status set to ${ds.s}.`);
  },
  freeze: () => {
    const p = activeProject(), c = activeCalc();
    const next = p.rev.length === 1 && p.rev < "Z" ? String.fromCharCode(p.rev.charCodeAt(0) + 1) : p.rev + "1";
    p.revisions.push({
      rev: p.rev, ts: nowISO(), user: S.user, note: `Frozen at ${p.status}`,
      selling: c.selling, buckets: Object.assign({}, c.buckets)
    });
    log(p.code, "Revision frozen", p.rev, next); p.rev = next; touch(p);
    recalcAll(); render(); toast(`Revision frozen. Working revision is now ${next}.`);
  },
  saveTemplate: () => {
    const p = activeProject();
    const t = {
      id: uid(), name: `${p.machine || p.name} — template`, note: `From ${p.code} Rev ${p.rev}`,
      bu: p.bu, category: p.category, machine: p.machine, by: S.user, ts: nowISO(),
      markup: { ...p.markup }, landed: { ...p.landed }, lines: JSON.parse(JSON.stringify(p.lines))
    };
    S.db.templates.unshift(t); log(p.code, "Saved as template", "—", t.name);
    render(); toast("Saved to the template library.");
  },
  useTemplate: (ds) => {
    const t = S.db.templates.find(x => x.id === ds.id);
    const p = blankProject({
      name: `${t.name} — new enquiry`, bu: t.bu, category: t.category, machine: t.machine,
      code: S.cfg.defaults.codePrefix + Math.floor(500 + Math.random() * 400)
    });
    p.lines = JSON.parse(JSON.stringify(t.lines)); p.markup = { ...t.markup }; p.landed = { ...t.landed };
    S.db.projects.unshift(p); S.activeId = p.id; S.view = "details";
    log(p.code, "Project created from template", t.name, p.code);
    recalcAll(); render(); toast(`New draft created from ${t.name}. Set the customer and quantity.`);
  },
  delTemplate: (ds) => {
    const idx = S.db.templates.findIndex(x => x.id === ds.id), t = S.db.templates[idx];
    S.db.templates.splice(idx, 1);
    log("Template library", "Template deleted", t.name, "—"); render();
    withUndo(`Template "${t.name}" deleted.`, () => S.db.templates.splice(idx, 0, t));
  },

  gridSort: (ds) => {
    const cur = S.gridSort[ds.mod];
    S.gridSort[ds.mod] = (cur && cur.k === ds.k) ? (cur.dir > 0 ? { k: ds.k, dir: -1 } : null) : { k: ds.k, dir: 1 };
    render();
  },
  gridQClear: (ds) => { S.gridQ[ds.mod] = ""; render(); },
  selClear: (ds) => { S.sel[ds.mod] = []; render(); },
  bulkDup: (ds) => {
    const p = activeProject(), ids = S.sel[ds.mod] || [];
    const copies = p.lines[ds.mod].filter(r => ids.includes(r.id)).map(r => Object.assign({}, r, { id: uid() }));
    p.lines[ds.mod] = p.lines[ds.mod].concat(copies); touch(p);
    log(p.code, `${MOD_MAP[ds.mod].label} · ${copies.length} lines duplicated`, "—", `${copies.length} copies`);
    S.sel[ds.mod] = []; recalcAll(); render(); toast(`${copies.length} lines duplicated.`);
  },
  bulkDel: (ds) => {
    const p = activeProject(), ids = S.sel[ds.mod] || [];
    const before = p.lines[ds.mod].slice();
    p.lines[ds.mod] = p.lines[ds.mod].filter(r => !ids.includes(r.id)); touch(p);
    log(p.code, `${MOD_MAP[ds.mod].label} · ${ids.length} lines deleted`, `${before.length} lines`, `${p.lines[ds.mod].length} lines`);
    S.sel[ds.mod] = []; recalcAll(); render();
    withUndo(`${ids.length} lines removed from ${MOD_MAP[ds.mod].label}.`, () => { activeProject().lines[ds.mod] = before; });
  },
  gotoMod: (ds) => { S.tab = ds.mod; S.view = "builder"; render(); },

  browseItems: (ds) => { S.cat = { q: "", cat: "All", pick: [], mod: ds.mod || "material", row: ds.row || null }; S.modal = "catalogue"; render(); },
  catUse: (ds) => {
    const it = itemByCode(ds.code), p = activeProject();
    const row = (p.lines[S.cat.mod] || []).find(r => r.id === S.cat.row);
    if (it && row) {
      applyItem(row, it); touch(p);
      log(p.code, `Material · line linked to ${it.code}`, "—", it.name);
    }
    S.modal = null; recalcAll(); render(); toast(`Linked to ${ds.code}.`);
  },
  catAdd: () => {
    const p = activeProject(), mod = MOD_MAP[S.cat.mod];
    const added = S.cat.pick.map(code => applyItem(Object.assign(mod.blank(), { qty: 1 }), itemByCode(code)));
    p.lines[mod.key] = (p.lines[mod.key] || []).concat(added); touch(p);
    log(p.code, `${mod.label} · ${added.length} catalogue items added`, "—", S.cat.pick.join(", ").slice(0, 60));
    S.modal = null; recalcAll(); render(); toast(`${added.length} catalogue items added.`);
  },
  reprice: () => {
    const p = activeProject(), c = activeCalc();
    const h = catalogueHealth(c);
    if (!h.drift.length) return toast("Every linked line already matches the catalogue.");
    const before = JSON.parse(JSON.stringify(p.lines.material));
    h.drift.forEach(d => {
      const row = p.lines.material.find(r => r.id === d.id), it = itemByCode(row.code);
      if (it) { row.price = it.price; row.cur = it.cur || "INR"; }
    });
    touch(p); log(p.code, "Material re-priced from the catalogue", `${h.drift.length} lines`, "current prices");
    recalcAll(); render();
    withUndo(`${h.drift.length} lines re-priced from the catalogue.`, () => { activeProject().lines.material = before; });
  },
  importMaster: () => {
    S.imp = { text: "", header: true, mode: "append", map: null, master: S.masterTab };
    S.modal = "import"; render();
  },
  filterBUClick: (ds) => { S.filterBU = S.filterBU === ds.bu ? "All" : ds.bu; render(); },
  addRow: (ds) => {
    const p = activeProject(), m = MOD_MAP[ds.mod];
    p.lines[m.key].push(m.blank()); touch(p);
    log(p.code, `${m.label} · line added`, "—", "new line"); recalcAll(); render();
  },
  dupRow: (ds) => {
    const p = activeProject(), rows = p.lines[ds.mod];
    const r = rows.find(x => x.id === ds.row);
    rows.push(Object.assign({}, r, { id: uid() })); touch(p);
    log(p.code, `${MOD_MAP[ds.mod].label} · line duplicated`, "—", "copy"); recalcAll(); render();
  },
  delRow: (ds) => {
    const p = activeProject(), rows = p.lines[ds.mod];
    const idx = rows.findIndex(x => x.id === ds.row), row = rows[idx];
    rows.splice(idx, 1); touch(p);
    log(p.code, `${MOD_MAP[ds.mod].label} · line deleted`, "line", "—"); recalcAll(); render();
    withUndo(`Line removed from ${MOD_MAP[ds.mod].label}.`, () => {
      activeProject().lines[ds.mod].splice(idx, 0, row);
    });
  },
  addMaster: () => {
    const spec = MASTER_SPEC.find(s => s.k === S.masterTab);
    S.db.masters[spec.k].push(spec.blank());
    log(`Master · ${spec.l}`, "record added", "—", "new"); recalcAll(); render();
  },
  delMaster: (ds) => {
    const spec = MASTER_SPEC.find(s => s.k === S.masterTab);
    const list = S.db.masters[spec.k];
    const idx = list.findIndex(x => x.id === ds.row), r = list[idx];
    list.splice(idx, 1);
    log(`Master · ${spec.l}`, "record deleted", r.name || r.band || r.code, "—"); recalcAll(); render();
    withUndo(`${esc(r.name || r.band || r.code)} removed from ${spec.l}.`,
      () => S.db.masters[spec.k].splice(idx, 0, r));
  },

  openImport: () => { S.imp = { text: "", header: true, mode: "append", map: null }; S.modal = "import"; render(); },
  impFile: () => {
    const inp = $("#impFileInput");
    inp.onchange = (e) => {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      const fr = new FileReader();
      fr.onload = () => { S.imp.text = String(fr.result || ""); S.imp.map = null; render(); };
      fr.readAsText(file);
    };
    inp.click();
  },
  doImport: () => {
    const { built, tgt, matched } = importBuild();
    const rows = built.map(r => { const o = Object.assign({}, r); delete o._amt; return o; });
    if (tgt.isMaster) {
      const keep = S.imp.mode === "replace" ? [] : (S.db.masters[tgt.key] || []);
      S.db.masters[tgt.key] = keep.concat(rows);
      log(`Master · ${tgt.label}`, `${rows.length} records imported`, `${keep.length} records`, `${keep.length + rows.length} records`);
      S.modal = null; recalcAll(); render(); toast(`${rows.length} records imported into ${tgt.label}.`);
      return;
    }
    const p = activeProject();
    const keep = S.imp.mode === "replace" ? [] : p.lines[tgt.key];
    p.lines[tgt.key] = keep.concat(rows); touch(p);
    log(p.code, `${tgt.label} · ${rows.length} lines imported`, `${keep.length} lines`, `${keep.length + rows.length} lines`);
    S.modal = null; recalcAll(); render();
    toast(matched ? `${rows.length} lines imported — ${matched} priced from the catalogue.` : `${rows.length} lines imported into ${tgt.label}.`);
  }
};

/* --------------------------------- EVENTS -------------------------------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act]");
  if (!t) { if (S.notif && !e.target.closest(".pop")) { S.notif = false; render(); } return; }
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  const fn = ACT[t.dataset.act];
  if (fn) { e.preventDefault(); fn(t.dataset, e); }
});

document.addEventListener("input", (e) => {
  const t = e.target.closest("[data-act]"); if (!t) return;
  const a = t.dataset.act, p = activeProject();
  if (a === "cell" && p) {
    const row = (p.lines[t.dataset.mod] || []).find(r => r.id === t.dataset.row);
    if (!row) return;
    row[t.dataset.k] = t.value; touch(p); softUpdate();
  } else if (a === "landed" && p) {
    p.landed[t.dataset.k] = t.value; touch(p);
    if (t.type === "range") { const lab = t.closest(".field").querySelector("label"); if (lab) lab.textContent = `Contingency on site cost — ${t.value}%`; }
    softUpdate();
  } else if (a === "markup" && p) {
    p.markup[t.dataset.k] = t.value; touch(p);
    $$(`[data-act="markup"][data-k="${t.dataset.k}"]`).forEach(el => { if (el !== t) el.value = t.value; });
    softUpdate();
  } else if (a === "target" && p) {
    p.target = N(t.value) * fxOf(p.currency); touch(p); softUpdate();
    const btn = $('[data-act="applyTarget"]'); if (btn) btn.disabled = !p.target;
  } else if (a === "pfield" && p) {
    p[t.dataset.k] = t.value; touch(p); softUpdate();
  } else if (a === "mcell") {
    const spec = MASTER_SPEC.find(s => s.k === S.masterTab);
    const r = S.db.masters[spec.k].find(x => x.id === t.dataset.row);
    if (r) { r[t.dataset.k] = t.value; persist(); }
  } else if (a === "search") {
    S.query = t.value;
    if (S.view !== "projects" && S.view !== "audit") { S.view = "projects"; render(); $("#topbar input").focus(); }
    else { $("#sheet").innerHTML = sheetHTML(); }
  } else if (a === "impText") {
    S.imp.text = t.value; S.imp.map = null;
    const sel = window.getSelection && t.selectionStart;
    render(); const ta = $('[data-act="impText"]'); if (ta) { ta.focus(); ta.selectionStart = ta.selectionEnd = sel; }
  } else if (a === "catQ") {
    S.cat.q = t.value; render();
  } else if (a === "gridQ") {
    S.gridQ[t.dataset.mod] = t.value;
    render();
  } else if (a === "palQ") {
    S.pal.q = t.value; S.pal.sel = 0;
    const list = $("#palList"); if (list) list.innerHTML = paletteListHTML();
  } else if (a === "cfield") {
    S.cfg.company[t.dataset.k] = t.value; persist();
    const railMark = $("#rail .mark-text b"); if (railMark && t.dataset.k === "short") railMark.textContent = t.value;
  } else if (a === "setUser") { S.user = t.value; }
  else if (a === "npf") { S.np[t.dataset.k] = t.value; const b = $('[data-act="createProject"]'); if (b) b.disabled = !(S.np.name.trim().length > 2); }
});

document.addEventListener("change", (e) => {
  const t = e.target.closest("[data-act]"); if (!t) return;
  const a = t.dataset.act, p = activeProject();
  if (a === "cell" && p && t.tagName === "INPUT") {
    const mod = MOD_MAP[t.dataset.mod], col = mod.cols.find(c => c.k === t.dataset.k);
    if (col && col.t === "item") {
      const row = p.lines[mod.key].find(r => r.id === t.dataset.row); if (!row) return;
      const it = itemByCode(t.value);
      row.code = t.value;
      if (it) { applyItem(row, it); log(p.code, `${mod.label} · line linked to ${it.code}`, "—", it.name); }
      touch(p); recalcAll(); render();
    }
    return;
  }
  if (a === "cell" && p && t.tagName === "SELECT") {
    const mod = MOD_MAP[t.dataset.mod], col = mod.cols.find(c => c.k === t.dataset.k);
    const row = p.lines[mod.key].find(r => r.id === t.dataset.row); if (!row) return;
    row[col.k] = t.value;
    if (col.t === "master") {
      const rec = (S.db.masters[col.m] || []).find(x => x.name === t.value);
      if (rec) { if (col.fill) row[col.fill.to] = rec[col.fill.from]; if (col.fill2) row[col.fill2.to] = rec[col.fill2.from]; }
    }
    touch(p); log(p.code, `${mod.label} · ${col.l}`, "—", t.value); recalcAll(); render();
  }
  else if (a === "pfield" && p && t.tagName === "SELECT") { p[t.dataset.k] = t.value; touch(p); log(p.code, t.dataset.k, "—", t.value); recalcAll(); render(); }
  else if (a === "selRow") {
    const list = S.sel[t.dataset.mod] || (S.sel[t.dataset.mod] = []);
    const i = list.indexOf(t.dataset.row);
    if (t.checked && i < 0) list.push(t.dataset.row); else if (!t.checked && i >= 0) list.splice(i, 1);
    render();
  }
  else if (a === "selAll") {
    const mod = MOD_MAP[t.dataset.mod];
    S.sel[mod.key] = t.checked ? visibleRows(mod, activeCalc().lines[mod.key] || []).map(r => r.id) : [];
    render();
  }
  else if (a === "filterBU") { S.filterBU = t.value; render(); }
  else if (a === "filterStatus") { S.fStatus = t.value; render(); }
  else if (a === "setCurrency") { S.currency = t.value; saveUI(); render(); }
  else if (a === "setRole") { S.role = t.value; saveUI(); toast(`Acting as ${t.value}.`); render(); }
  else if (a === "revA") { S.revA = +t.value; render(); }
  else if (a === "revB") { S.revB = +t.value; render(); }
  else if (a === "npTpl") {
    S.np._tpl = t.value;
    const tp = (S.db.templates || []).find(x => x.id === t.value);
    if (tp) { S.np.bu = tp.bu; S.np.category = tp.category; S.np.machine = tp.machine; }
    render();
  }
  else if (a === "catCat") { S.cat.cat = t.value; render(); }
  else if (a === "catPick") {
    const i = S.cat.pick.indexOf(t.dataset.code);
    if (t.checked && i < 0) S.cat.pick.push(t.dataset.code); else if (!t.checked && i >= 0) S.cat.pick.splice(i, 1);
    render();
  }
  else if (a === "logoFile") {
    const file = t.files && t.files[0]; if (!file) return;
    if (file.size > 400 * 1024) toast("That file is large — consider one under 100 KB.");
    const fr = new FileReader();
    fr.onload = () => {
      S.cfg.brand[t.dataset.k] = String(fr.result || "");
      persist(); render(); toast("Logo applied. Export config.json to share it with the team.");
    };
    fr.readAsDataURL(file);
  }
  else if (a === "impHeader") { S.imp.header = t.checked; S.imp.map = null; render(); }
  else if (a === "impMode") { S.imp.mode = t.dataset.m; }
  else if (a === "impMap") { S.imp.map[t.dataset.k] = +t.value; render(); }
});

document.addEventListener("keydown", (e) => {
  // Command palette
  if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
    e.preventDefault(); S.pal ? closePalette() : openPalette(); return;
  }
  if (S.pal) {
    if (e.key === "Escape") { e.preventDefault(); closePalette(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); palMove(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); palMove(-1); }
    else if (e.key === "Enter") { e.preventDefault(); palRun(); }
    return;
  }
  if (e.key === "Escape") {
    if (S.modal) { S.modal = null; render(); return; }
    if (S.notif) { S.notif = false; render(); return; }
  }

  // Excel-style movement down a column of the cost grid
  const el = e.target;
  if (!el || el.tagName !== "INPUT" || !el.classList.contains("cell-input")) return;
  const cells = $$(`.cell-input[data-mod="${el.dataset.mod}"][data-k="${el.dataset.k}"]`)
    .filter(x => x.tagName === "INPUT");
  const i = cells.indexOf(el);
  const go = (j) => { const n = cells[j]; if (n) { n.focus(); if (n.select) n.select(); } };
  if (e.key === "ArrowDown" || e.key === "Enter") { e.preventDefault(); go(i + 1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); go(i - 1); }
  else if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
    e.preventDefault();
    if (cells[i - 1]) { el.value = cells[i - 1].value; el.dispatchEvent(new Event("input", { bubbles: true })); }
  }
});

/* ---------------------------------- BOOT --------------------------------- */
async function startApp(bundle) {
  const working = await loadWorking();
  S.db = working || {
    masters: bundle.masters, projects: bundle.projects || [],
    templates: bundle.templates || [], audit: bundle.audit || []
  };
  S.db.config = (working && working.config) || bundle.config;
  S.cfg = S.db.config;
  if (!S.cfg.brand) S.cfg.brand = { logo: "", logoDark: "" };
  loadUI();
  if (!S.cfg.roles[S.role]) S.role = "Cost Engineer";
  if (!S.db.masters.currency.some(c => c.code === S.currency)) S.currency = "INR";
  $("#app").innerHTML = `<aside class="rail" id="rail"></aside>
    <div class="main"><header class="topbar" id="topbar"></header><div class="sheet" id="sheet"></div></div>
    <div id="notif"></div><div id="modal"></div><div id="palette"></div><div id="toast"></div>`;
  recalcAll();
  render();
}

(async function boot() {
  try {
    const vault = await probeVault();
    if (vault) {
      if (!window.isSecureContext) throw new Error("Encryption needs https:// or localhost. This page is not a secure context.");
      const key = await keyFromSession();
      if (key) {
        try {
          const bundle = await decryptJSON(key, vault.iv, vault.ct);
          CRYPTO_KEY = key;
          await startApp(bundle);
          return;
        } catch (e) { try { sessionStorage.removeItem(SESSION_KEY); } catch (e2) { } }
      }
      showLock();
      return;
    }
    await startApp(await loadOpenBundle());
  } catch (err) {
    document.getElementById("app").innerHTML = `
      <div style="margin:auto;max-width:560px;padding:26px;font-family:system-ui;text-align:center;color:#0D1417">
        <h2 style="font-size:16px;margin:0 0 10px">Data files could not be loaded</h2>
        <p style="font-size:13px;line-height:1.6;color:#4A585F">
          This page reads <code>data/config.json</code>, <code>data/masters.json</code> and <code>data/projects.json</code>.
          Browsers block those reads when a page is opened directly from disk.<br><br>
          Serve the folder over HTTP instead — from this folder run<br>
          <code style="background:#EDF1F3;padding:3px 7px;border-radius:3px;display:inline-block;margin-top:6px">python -m http.server 8080</code><br>
          then open <b>http://localhost:8080</b>. On GitHub Pages it works with no setup.
        </p>
        <p style="font-size:11.5px;color:#7C8C94;margin-top:14px">${esc(err.message)}</p>
      </div>`;
    return;
  }
})();
