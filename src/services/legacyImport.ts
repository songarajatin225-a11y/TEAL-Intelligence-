import type { AnyRecord } from '../domain';
import { LASER_CATEGORIES } from '../domain/entities';

/*
 * LEGACY IMPORT (spec §7, §132). Brings the user's own data from the legacy apps into the OS
 * as local drafts — in the browser, never via the public repository:
 *   - PM Tracker: its IndexedDB `laser_pm_tracker` (same GitHub Pages origin) or a backup JSON
 *   - Cost Platform: its localStorage key `teal:costing:db:v1` (same origin) or an exported JSON
 * Ids are derived from legacy ids so re-importing updates rather than duplicates.
 */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? '' : String(v)).trim();
const num = (v: unknown): number | null => {
  const x = parseFloat(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(x) ? x : null;
};
const safe = (v: unknown) => s(v).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 60) || Math.random().toString(36).slice(2, 10);
const date = (v: unknown) => (/^\d{4}-\d{2}-\d{2}/.test(s(v)) ? s(v).slice(0, 10) : undefined);
const prov = (doc: string) => ({ verification_status: 'DRAFT' as const, source_id: 'src-legacy-pm-tracker', document: doc, note: 'Imported from the user’s own legacy tracker data (unverified).' });

export interface LegacyImportResult {
  records: AnyRecord[];
  counts: Record<string, number>;
  warnings: string[];
}

const OPP_STAGE: Record<string, string> = {
  Lead: 'Lead', Contacted: 'Discovery', Discussion: 'Discovery', 'Technical Evaluation': 'Feasibility', Sample: 'POC', Demo: 'POC', Trial: 'POC',
  Qualification: 'POC', Commercial: 'Proposal', Order: 'Won', Lost: 'Lost',
};
const ACT_STATUS: Record<string, string> = {
  'Not Started': 'Not Started', 'In Progress': 'In Progress', 'Waiting for Customer': 'Waiting', 'Waiting for Internal Team': 'Waiting', 'Technical Evaluation': 'In Progress',
  Sample: 'In Progress', Demo: 'In Progress', Trial: 'In Progress', Qualification: 'In Progress', Completed: 'Completed', 'On Hold': 'Waiting', Cancelled: 'Cancelled', Blocked: 'Blocked',
};
const PRIORITY = new Set(['Critical', 'High', 'Medium', 'Low']);
const APP_PROCESS: Record<string, string> = { 'Laser Marking': 'Marking', 'Laser Welding': 'Welding', 'Laser Cutting': 'Cutting', Inspection: 'Inspection', Metrology: 'Metrology', 'Semiconductor Equipment': 'Handling' };
const LASER_CAT: Record<string, string> = { 'Laser Diode': 'Diode', 'Diode Bar': 'Diode', 'Diode Stack': 'Diode', VCSEL: 'Diode', DFB: 'Diode', DBR: 'Diode', SLED: 'Diode', 'Fibre Laser': 'Fiber', DPSS: 'DPSS', 'Solid State': 'DPSS', CO2: 'CO2' };
const SAMPLE_STATUS: Record<string, string> = { Requested: 'Planned', 'Supplier Confirmation': 'Planned', 'In Transit': 'Samples Awaited', Received: 'In Progress', 'Internal Testing': 'In Progress', 'Customer Demo': 'In Progress', 'Customer Trial': 'In Progress', Feedback: 'Analysis', Qualification: 'Analysis', Closed: 'Complete' };

export function mapTrackerBackup(payload: Row): LegacyImportResult {
  const warnings: string[] = [];
  const out: AnyRecord[] = [];
  const counts: Record<string, number> = {};
  const add = (r: Row) => {
    out.push(r as AnyRecord);
    counts[String(r.entity)] = (counts[String(r.entity)] ?? 0) + 1;
  };
  const list = (k: string) => (Array.isArray(payload[k]) ? (payload[k] as Row[]) : []);
  if (payload.schemaVersion === undefined) warnings.push('No schemaVersion — file may not be a tracker backup; importing what can be recognised.');

  const custIdByName = new Map<string, string>();
  for (const c of list('customers')) {
    const id = `cus-lt${safe(c.id ?? c.code)}`;
    custIdByName.set(s(c.company).toLowerCase(), id);
    add({
      id, entity: 'customer', name: s(c.company) || s(c.code), industry: s(c.industry) || undefined, segment: s(c.segment) || undefined, location: s(c.location) || undefined,
      contacts: s(c.contactPerson) ? [{ name: s(c.contactPerson), role: s(c.designation) || undefined, email: s(c.email) || undefined, phone: s(c.phone) || undefined }] : [],
      notes: [s(c.customerRequirement), s(c.remarks)].filter(Boolean).join('\n') || undefined, owner: s(c.owner) || undefined,
      data_type: 'USER_CREATED', provenance: prov('tracker.customers'), tags: ['legacy-tracker'],
      ...(date(c.nextInteraction) ? { next_action: { action: 'Next interaction (from tracker)', due: date(c.nextInteraction) } } : {}),
    });
    if (s(c.tealOpportunity) || s(c.opportunityStage)) {
      add({
        id: `opp-lt${safe(c.id ?? c.code)}`, entity: 'opportunity', name: `${s(c.company)}: ${s(c.tealOpportunity) || s(c.application) || 'Opportunity'}`,
        stage: OPP_STAGE[s(c.opportunityStage)] ?? 'Lead', customer_id: id, probability: num(c.probability), value: null, industry: s(c.industry) || undefined,
        technical_status: s(c.technicalGap) || undefined, commercial_status: s(c.procurementStatus) || undefined, data_type: 'USER_CREATED', provenance: prov('tracker.customers'), tags: ['legacy-tracker'],
        ...(date(c.nextInteraction) ? { next_action: { action: 'Follow up (from tracker)', due: date(c.nextInteraction) } } : {}),
      });
    }
  }
  const custRef = (name: unknown) => custIdByName.get(s(name).toLowerCase());

  for (const a of list('activities')) {
    add({
      id: `act-lt${safe(a.id ?? a.code)}`, entity: 'activity', kind: 'task', name: s(a.activity) || s(a.code), priority: PRIORITY.has(s(a.priority)) ? s(a.priority) : 'Medium',
      status: ACT_STATUS[s(a.status)] ?? 'Not Started', due_date: date(a.targetDate), follow_up_date: date(a.nextActionDate), customer_id: custRef(a.customer), workstream: s(a.workstream) || undefined,
      blocker: s(a.blocker) || undefined, description: [s(a.currentSituation), s(a.requiredAction)].filter(Boolean).join('\n') || undefined, owner: s(a.owner) || undefined,
      ...(s(a.nextAction) ? { next_action: { action: s(a.nextAction), due: date(a.nextActionDate) } } : {}),
      data_type: 'USER_CREATED', provenance: prov('tracker.activities'), tags: ['legacy-tracker'],
    });
  }
  for (const m of list('meetings')) {
    add({
      id: `act-ltm${safe(m.id ?? m.code)}`, entity: 'activity', kind: 'meeting', name: s(m.objective) || `Meeting ${s(m.code)}`, priority: 'Medium', status: ACT_STATUS[s(m.status)] ?? 'Completed',
      due_date: date(m.meetingDate), customer_id: custRef(m.customer), minutes: s(m.keyDiscussion) || undefined, description: [s(m.decision), s(m.customerRequirement)].filter(Boolean).join('\n') || undefined,
      ...(s(m.actionItem) ? { next_action: { action: s(m.actionItem), due: date(m.dueDate), owner: s(m.owner) || undefined } } : {}),
      data_type: 'USER_CREATED', provenance: prov('tracker.meetings'), tags: ['legacy-tracker'],
    });
  }
  for (const a of list('applications')) {
    add({
      id: `app-lt${safe(a.id ?? a.code)}`, entity: 'application', name: s(a.application) + (s(a.endProduct) ? ` — ${s(a.endProduct)}` : ''), process: APP_PROCESS[s(a.application)] ?? 'Other',
      industries: s(a.industry) ? [s(a.industry)] : [], description: s(a.laserFunction) || undefined, rationale: s(a.technicalRequirement) || undefined, status: s(a.applicationStatus) || undefined,
      data_type: 'USER_CREATED', provenance: prov('tracker.applications'), tags: ['legacy-tracker'],
    });
  }
  for (const p of list('products')) {
    const cat = LASER_CAT[s(p.laserType)];
    const wl = num(p.wavelength);
    add({
      id: `las-lt${safe(p.id ?? p.code)}`, entity: 'laser_source', kind: 'product', name: `${s(p.manufacturer)} ${s(p.partNumber)}`.trim() || s(p.code), manufacturer: s(p.manufacturer) || null, model: s(p.partNumber) || null,
      family: s(p.productFamily) || undefined, categories: cat && (LASER_CATEGORIES as readonly string[]).includes(cat) ? [cat] : [], wavelength: { value: wl, unit: 'nm', original: s(p.wavelength) || undefined },
      mode: /cw/i.test(s(p.mode)) && !/pulse/i.test(s(p.mode)) ? 'cw' : 'pulsed', m2: null, beam_diameter_mm: null, average_power_w: null,
      description: [s(p.power) && `Power: ${s(p.power)}`, s(p.package) && `Package: ${s(p.package)}`, s(p.remarks)].filter(Boolean).join(' · ') || undefined,
      data_type: 'USER_CREATED', provenance: prov('tracker.products'), tags: ['legacy-tracker'],
    });
  }
  for (const x of list('samples')) {
    add({
      id: `poc-lt${safe(x.id ?? x.code)}`, entity: 'poc', name: `Sample: ${s(x.product) || s(x.partNumber)} — ${s(x.customer)}`, poc_status: SAMPLE_STATUS[s(x.sampleStatus)] ?? 'Planned',
      customer_id: custRef(x.customer), objective: s(x.application) || 'Sample / demo / trial', part: s(x.partNumber) || undefined, conclusion: s(x.testResult) || undefined, decision: 'Undecided',
      open_questions: s(x.technicalIssue) ? [s(x.technicalIssue)] : [], data_type: 'USER_CREATED', provenance: prov('tracker.samples'), tags: ['legacy-tracker', 'sample'],
      ...(s(x.nextStep) ? { next_action: { action: s(x.nextStep) } } : {}),
    });
  }
  for (const l of list('localization')) {
    add({
      id: `loc-lt${safe(l.id ?? l.code)}`, entity: 'localization', name: s(l.projectName) || s(l.code), imported_component: s(l.currentImportedPart) || s(l.laserDiodeType) || s(l.projectName),
      technology_gap: s(l.technologyGap) || undefined, current_cost: num(l.importedCost), localized_cost: num(l.expectedLocalizedCost), classification: 'UNDECIDED', stage: s(l.currentStatus) || undefined,
      ...(s(l.nextAction) ? { next_action: { action: s(l.nextAction), due: date(l.nextActionDate) } } : {}),
      data_type: 'USER_CREATED', provenance: prov('tracker.localization'), tags: ['legacy-tracker'],
    });
  }
  for (const x of list('suppliers')) {
    add({
      id: `sup-lt${safe(x.id ?? x.code)}`, entity: 'supplier', name: s(x.company) || s(x.code), country: s(x.country) || undefined, category: s(x.partnerType) || undefined,
      products: s(x.product) ? [s(x.product)] : [], capabilities: [s(x.technology), s(x.manufacturingCapability)].filter(Boolean), india_presence: s(x.indiaSupport) || undefined,
      ...(s(x.nextAction) ? { next_action: { action: s(x.nextAction), due: date(x.nextActionDate) } } : {}),
      data_type: 'USER_CREATED', provenance: prov('tracker.suppliers'), tags: ['legacy-tracker'],
    });
  }
  for (const c of list('competitors')) {
    add({
      id: `co-lt${safe(c.id ?? c.code)}`, entity: 'company', name: s(c.competitor) || s(c.code), roles: ['competitor'],
      description: [`Threat: ${s(c.threatLevel) || 'UNKNOWN'}`, s(c.product) && `Product: ${s(c.product)}`, s(c.technologyAdvantage) && `Advantage: ${s(c.technologyAdvantage)}`, s(c.pricing) && `Pricing note: ${s(c.pricing)}`, s(c.source) && `Source: ${s(c.source)}`].filter(Boolean).join(' · '),
      data_type: 'USER_CREATED', provenance: prov('tracker.competitors'), tags: ['legacy-tracker', 'competitor'],
    });
  }
  for (const d of list('dailyLogs')) {
    add({
      id: `act-ltd${safe(d.id ?? d.date)}`, entity: 'activity', kind: 'daily_log', name: `Daily log ${s(d.date)}`, priority: 'Low', status: 'Completed', due_date: date(d.date),
      description: ['priority1', 'priority2', 'priority3', 'keyAchievement', 'keyIssue', 'tomorrowPriority', 'notes'].map((k) => s(d[k])).filter(Boolean).join('\n') || undefined,
      data_type: 'USER_CREATED', provenance: prov('tracker.dailyLogs'), tags: ['legacy-tracker'],
    });
  }
  for (const w of list('weeklyReviews')) {
    add({ id: `act-ltw${safe(w.id ?? w.weekStart)}`, entity: 'activity', kind: 'note', name: `Weekly review ${s(w.weekStart)}`, priority: 'Low', status: 'Completed', due_date: date(w.weekStart), description: JSON.stringify(w), data_type: 'USER_CREATED', provenance: prov('tracker.weeklyReviews'), tags: ['legacy-tracker'] });
  }
  return { records: out, counts, warnings };
}

/** Read the legacy tracker's IndexedDB in this browser WITHOUT creating it if absent. */
export async function readTrackerFromBrowser(): Promise<Row | null> {
  if (typeof indexedDB === 'undefined') return null;
  const dbs = (indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string }[]> }).databases;
  if (typeof dbs === 'function') {
    const list = await dbs.call(indexedDB);
    if (!list.some((d) => d.name === 'laser_pm_tracker')) return null;
  }
  return new Promise((resolve) => {
    const req = indexedDB.open('laser_pm_tracker');
    req.onupgradeneeded = () => req.transaction?.abort(); // never create the legacy database
    req.onerror = () => resolve(null);
    req.onsuccess = () => {
      const db = req.result;
      const stores = [...db.objectStoreNames].filter((n) => n !== 'settings');
      if (!stores.length) {
        db.close();
        resolve(null);
        return;
      }
      const tx = db.transaction(stores, 'readonly');
      const payload: Row = { app: 'Laser Applications PM Operating Tracker', schemaVersion: db.version };
      let pending = stores.length;
      for (const st of stores) {
        const r = tx.objectStore(st).getAll();
        r.onsuccess = () => {
          payload[st] = r.result;
          if (--pending === 0) {
            db.close();
            resolve(payload);
          }
        };
        r.onerror = () => {
          if (--pending === 0) resolve(payload);
        };
      }
    };
  });
}

/* ------------------------------------------------------------ cost platform */

export function mapCostPlatform(db: Row): LegacyImportResult {
  const warnings: string[] = [];
  const out: AnyRecord[] = [];
  const counts: Record<string, number> = {};
  if ((db as { ct?: unknown }).ct) {
    return { records: [], counts, warnings: ['The legacy cost data in this browser is encrypted (vault). Unlock it in the legacy Cost Platform and use its "Export JSON", then import that file here.'] };
  }
  const projects = Array.isArray(db.projects) ? (db.projects as Row[]) : [];
  const custIds = new Map<string, string>();
  for (const p of projects) {
    const cname = s(p.customer);
    let cid: string | undefined;
    if (cname) {
      cid = custIds.get(cname.toLowerCase());
      if (!cid) {
        cid = `cus-lc${safe(cname.toLowerCase().replace(/\s+/g, '-'))}`;
        custIds.set(cname.toLowerCase(), cid);
        out.push({ id: cid, entity: 'customer', name: cname, data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT', source_id: 'src-legacy-cost-platform', note: 'Customer name from the user’s legacy cost project.' }, tags: ['legacy-cost'] } as AnyRecord);
        counts.customer = (counts.customer ?? 0) + 1;
      }
    }
    out.push({
      id: `cst-lc${safe(p.id ?? p.code)}`,
      entity: 'cost_model',
      name: `${s(p.code)} ${s(p.name)}`.trim(),
      description: s(p.notes) || undefined,
      currency: ['INR', 'USD', 'EUR', 'JPY'].includes(s(p.currency)) ? s(p.currency) : 'INR',
      qty: Math.max(1, Math.round(num(p.qty) ?? 1)),
      customer_id: cid,
      lines: (p.lines as Row) ?? {},
      landed: p.landed,
      markup: p.markup,
      ...(p.teal ? { teal: { insurancePct: 0.05, sgaPct: 8, warrantyPct: 2.5, profitPct: 12, ossMonthly: 65000, stationHc: 0.5, ossMonths: 12, packRate: 1600, ...(p.teal as Row) } } : {}),
      status: s(p.status) || undefined,
      scenario: 'Base',
      data_type: 'USER_CREATED',
      provenance: { verification_status: 'DRAFT', source_id: 'src-legacy-cost-platform', document: 'legacy cost platform working data', note: `Imported (rev ${s(p.rev) || '—'}).` },
      tags: ['legacy-cost'],
    } as unknown as AnyRecord);
    counts.cost_model = (counts.cost_model ?? 0) + 1;
  }
  if (!projects.length) warnings.push('No projects found in the cost platform data.');
  // customer_id is not part of the cost model schema; keep the link through `links`
  for (const r of out) {
    const x = r as Record<string, unknown>;
    if (r.entity === 'cost_model' && x.customer_id) {
      x.links = [{ rel: 'belongs_to', target: x.customer_id as string }];
      delete x.customer_id;
    }
  }
  return { records: out, counts, warnings };
}

export function readCostFromBrowser(): Row | null {
  try {
    const raw = localStorage.getItem('teal:costing:db:v1');
    return raw ? (JSON.parse(raw) as Row) : null;
  } catch {
    return null;
  }
}
