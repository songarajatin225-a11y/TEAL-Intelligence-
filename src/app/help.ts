/**
 * CONTEXTUAL HELP (spec §98): what a page does, key terms, typical workflow, next step.
 * Keyed by route; the help drawer picks the longest matching prefix.
 */
export interface HelpEntry {
  what: string;
  terms?: [string, string][];
  workflow?: string[];
  next?: string;
}

export const HELP: Record<string, HelpEntry> = {
  '/': {
    what: 'Mission Control is your starting point: what needs attention now, what you are working on, and what is changing across the engineering system.',
    workflow: ['Clear the attention list top-down (critical first).', 'Open My Work to continue projects, POCs and opportunities.', 'Use Quick actions or press N to create something new.'],
    next: 'Every item links to its record; the record shows its full digital thread.',
  },
  '/pm': { what: 'My Workspace is the product manager’s day: today, this week, overdue, follow-ups, meetings and next actions across every record.', workflow: ['Work the Overdue tab first.', 'Log meetings and follow-ups as activities.', 'Keep one next action on every active opportunity, POC, project and risk.'] },
  '/inquiry': {
    what: 'Turns a customer’s own words into a complete draft package: opportunity, requirements, platform match with reasons, configuration, BOM, cost, POC, DOE plan, risks, open questions, G0 checklist and project.',
    terms: [['Draft', 'Everything generated is a local draft until someone validates it.'], ['Score', 'How strongly the inquiry matches a platform’s process, material, industry and throughput.']],
    workflow: ['Paste the inquiry (or pick an example).', 'Pick or name the customer.', 'Generate, review the package, then save all drafts in one step.'],
    next: 'Open the created opportunity; its Intelligence tab shows what is still missing.',
  },
  '/opportunities': { what: 'The customer pipeline from lead to won or lost. Every active opportunity must carry a next action.', terms: [['Stage', 'Lead → Discovery → Requirement → Feasibility → POC → Proposal → Negotiation → Won / Lost.']] },
  '/products': { what: 'TEAL’s catalogue of machine platforms. Open a product to see its Product DNA: applications, sources, optics, modules, BOMs, cost, POCs and projects that use it.', terms: [['Standard content', 'Modules included in the platform base price — never charged twice.'], ['Estimate', 'Platform prices are parametric estimates, not quotations.']] },
  '/configurator': {
    what: 'Configure a machine: platform, application, laser source and power, objective, modules and software. Price, designation, optics physics, compatibility and recommendations update live.',
    workflow: ['Choose family and platform.', 'Pick the application; defaults follow.', 'Adjust source, power, lens and modules; resolve warnings.', 'Save the configuration, then generate its BOM and cost.'],
    next: 'Open in the 3D simulator (legacy) with the same state.',
  },
  '/laser': { what: 'The laser domain at a glance: the beam path from source to workpiece, and the sources, optics, scanners, process and calculators behind each stage.', terms: [['Spot size', 'd ≈ 4λfM²/(πD) — Automation Handbook formula L1.'], ['Fluence', 'Pulse energy per area; decides the process regime.']] },
  '/laser-sources': { what: 'Source technologies the configurator offers, with representative parameters for diffraction-limited estimates. These are classes, not datasheets.' },
  '/calculators': { what: 'Laser, automation, quality and cost formulas from the Automation Handbook Part 54. Every result shows its formula, inputs with units and citation (WHY?). Missing inputs give “insufficient data”, never a guess.' },
  '/cost': {
    what: 'Cost models reproduce the legacy TEAL Cost Platform exactly: 12 cost modules, landed cost, overheads, contingency, profit, the TEAL A/B/C/D cost sheet, scenarios, price-to-win and customer economics.',
    terms: [['Landed cost', 'Basic + freight + duty + landing; GST shown but not costed.'], ['TEAL D', 'C / (1 − profit − warranty) — Handbook C1.']],
  },
  '/bom': { what: 'Bills of material with a cost basis on every line: Quoted, Catalogue, Estimate, Demo or Unknown. Generate RFQs, cost models and localization candidates from any BOM.' },
  '/rfq': { what: 'Requests for quotation generated from BOMs. Record quotes, compare and apply the selection back to the BOM as QUOTED.' },
  '/projects': { what: 'Delivery projects with a Gantt, critical path and the G0–G10 gate reviews.', terms: [['Critical path', 'Tasks with zero slack; delaying them delays the project.']] },
  '/gates': {
    what: 'Design review gates G0–G10 from the Automation Handbook, with the rules the system enforces.',
    terms: [['R1', 'No GO while mandatory evidence is missing.'], ['R2', 'The previous gate must have passed.'], ['R3', 'Conditions from the previous gate must be closed.'], ['R4', 'GO WITH CONDITIONS needs owners and dates.'], ['R5', 'Customer-facing gates need the customer’s signature.']],
  },
  '/fat-sat': { what: 'Acceptance protocols generated from requirements plus the handbook FAT/SAT checklists. Every test starts NOT RUN; results are recorded, never assumed.' },
  '/traceability': { what: 'The signature engineering chain: requirement → design / module → BOM line → FAT → SAT, with missing links flagged per requirement.' },
  '/knowledge': { what: 'The three TEAL handbooks as searchable, citable Markdown. Every citation in the system opens the exact section here.' },
  '/search': { what: 'Search everything: records, handbook sections and your local drafts.', terms: [['entity:product', 'Limit to one type.'], ['book:laser', 'Limit to one handbook.'], ['"exact phrase"', 'Match a phrase.']] },
  '/graph': { what: 'Explore how records connect — customer, opportunity, product, module, BOM, supplier, project, lesson. Click a node to focus on its neighbours.' },
  '/semiconductor': { what: 'The semiconductor value chain from the Semiconductor Handbook, with where lasers and automation contribute, and the equipment buyer’s view.' },
  '/global': { what: 'Global engineering intelligence arrives only through the reviewed ingestion pipeline. The browser never scrapes the web; nothing is invented while data is missing.' },
  '/admin': {
    what: 'Your local workspace: drafts, change packages, backups, legacy import and the optional local workspace lock.',
    terms: [['Local draft', 'A record stored only in this browser.'], ['Change package', 'A ZIP of drafts to apply to the repository in a reviewed pull request.'], ['Local workspace lock', 'A convenience screen lock — not security.']],
  },
  '/ask': {
    what: 'Ask a question in plain language. The answer is assembled from records, handbook sections, the digital-thread graph and the gap engine — no AI model is connected, and nothing is written that is not in the data.',
    terms: [['Confidence', 'Share of matched sources that are verified or source-documented. DEMO records never count as verified.']],
    workflow: ['Ask the question.', 'Read the direct answer and confidence.', 'Open the findings and evidence; check the unknowns.', 'Act on the recommended next steps.'],
  },
  '/rooms': { what: 'Rooms put everything about one program, product, POC, supplier, opportunity or customer in one place: next action, attention, activities and meetings, risks, decisions and changes, lessons, engineering work, health, gaps, timeline and evidence.', workflow: ['Pick a room.', 'Clear “Now” first.', 'Log activities, risks, decisions, changes and lessons from the room — they are linked automatically.'] },
  '/leads': {
    what: 'LeadConnect captures a lead at an exhibition in under a minute. One save creates the customer (if new), a Lead-stage opportunity and a dated follow-up activity — all local drafts.',
    terms: [['Event tag', 'Every lead carries event:<name>, so an event’s leads can be reviewed and exported together.']],
    workflow: ['Type the event once.', 'Company, contact, product of interest, what they asked.', 'Save — the form clears for the next visitor.', 'After the show, work the follow-ups in My Workspace.'],
  },
  '/business-case': { what: 'Competitors recorded on opportunities and companies, market size with a source for every figure, and a cash-flow business case (NPV, payback, margin) with ±10 % sensitivity. Nothing is looked up or invented.', terms: [['TAM / SAM / SOM', 'Total, serviceable and obtainable market — each must be a subset of the one before.'], ['NPV', 'Σ cash flow ÷ (1 + r)^year, year 0 = investment.']] },
  '/value': { what: 'Business value of the platform: records held, how much is reused across products, which domains are covered and where products stand. Counts of records only.' },
  '/domains': { what: 'The domain architecture: Laser & Photonics, Electronics & EMS, Semiconductor, Battery & New Energy, Industrial Automation, Advanced Manufacturing. Each domain is a data record — adding a domain needs no code.' },
  '/cross-domain': { what: 'Technology × domain matrix. A number is TEAL application records in that domain’s industries; ● means the domain’s taxonomy names the technology. Empty means no record says so.' },
  '/solution': {
    what: 'The Application Intelligence engine and universal configurator: industry → part → material → process → application → technology → machine → subsystem, then requirements, architecture, suppliers, indicative BOM and cost, risks, localization and development complexity.',
    terms: [['Complexity', 'High = no catalogued application or a failed check; Medium = modules added, warnings, or inline / fully automatic handling; Low otherwise.'], ['Automation level', 'Adds handling modules by a published rule, only where they fit the platform and do not conflict.']],
    workflow: ['Pick industry, material and process.', 'Choose one of the matching TEAL applications.', 'Set throughput, accuracy and automation.', 'Open in the configurator or create an opportunity.'],
  },
  '/product-architecture': { what: 'Product → system → subsystem → module → component, with specification, supplier and cost at the leaves, for a platform’s standard configuration or a saved configuration.' },
  '/development': { what: 'Product development lifecycle (17 stages). Each opportunity or project sits at its first stage without evidence; every stage shows the rule it needs.' },
  '/capture': { what: 'Structured customer requirements. Each filled field becomes a URS requirement; nothing is filled in for the customer and no acceptance criterion is assumed.' },
  '/execution': { what: 'Project tasks and activities as kanban, table, timeline, calendar and milestones, plus a severity × occurrence risk matrix. Moving a card saves a local draft.' },
  '/documents': { what: 'Generate PRD, RFQ, technical specification, BOM, supplier comparison, POC plan, DFM checklist, validation plan, MOM, product review and technology assessment from records. UNKNOWN where nothing is recorded.' },
  '/opportunity-matrix': { what: 'Every opportunity against market, industry, customer, application, technology, market size, capability, partner need, investment, development time, localization and strategic relevance. No automatic scores.' },
  '/settings': { what: 'Appearance, workspace, the provider seams (data, search, sync, auth) and the honest security limits of a static GitHub Pages app.' },
  '/import-export': { what: 'Export any dataset as CSV/JSON, export drafts as a change package, back up or restore the workspace, import legacy data.' },
  '/compare': { what: 'Up to four records of one type side by side. Rows that differ are highlighted; “Only differences” hides the rest. Unknown values stay unknown.', workflow: ['Pick a type, or use “Compare with…” on a record.', 'Add records.', 'Toggle “Only differences”.'] },
  '/supplier-risk': { what: 'Recorded supplier risk against dependency (component-master items naming the supplier). Suppliers without an assessment stay UNKNOWN — the system never assigns risk.', terms: [['Single-source', 'The supplier is the only vendor for that component category.'], ['Long-lead', 'Lead time of 8 weeks or more.']] },
  '/duplicates': { what: 'Likely duplicate records within each type, with the rule that matched. Nothing is merged automatically — compare the pair, then edit or delete one as a local draft.' },
  '/units': { what: 'Engineering unit conversion using the same engine as the calculators. Currency is not converted here: it needs a dated FX rate.' },
  '/data-quality': { what: 'The health of master data and your drafts: broken references, missing sources, unknown units, duplicates, stale prices and conflicts.' },
};

export function helpFor(pathname: string): HelpEntry | undefined {
  if (HELP[pathname]) return HELP[pathname];
  const keys = Object.keys(HELP).filter((k) => k !== '/' && pathname.startsWith(`${k}/`));
  return keys.sort((a, b) => b.length - a.length).map((k) => HELP[k])[0];
}

export const GLOSSARY: [string, string][] = [
  ['Trust labels', 'VERIFIED · REFERENCE · ESTIMATED · USER ADDED · TO BE VALIDATED · DEMO DATA — one label per record, derived from its data type, verification and origin.'],
  ['TRL', 'Technology Readiness Level 1–9. Maturity lane follows only from TRL: 1–3 Emerging, 4–5 Experimental, 6–7 Developing, 8–9 Mature, 9 + ≥3 suppliers Commodity.'],
  ['Sync pending', 'Local changes made after the last change-package export. Nothing syncs automatically; a pull request makes changes permanent.'],
  ['Health', 'Healthy · Attention · At Risk · Incomplete — computed from completeness, evidence, thread gaps, timeliness and open risks. Every dimension shows its reason.'],
  ['Digital thread', 'Every record links to the ones it came from and leads to: inquiry → requirement → product → BOM → cost → project → FAT/SAT → field → lesson.'],
  ['Local draft', 'Created or edited in this browser. Permanent repository update requires a GitHub commit (via a change package).'],
  ['Verified', 'Checked by a reviewer against a source.'],
  ['Source linked', 'Documented in a cited source, not independently verified.'],
  ['Estimate', 'A calculated or parametric value — useful for decisions, not a quotation.'],
  ['Demo', 'Fictional data used to demonstrate a workflow.'],
  ['Unknown', 'No verified value exists. The system never fills gaps with guesses.'],
  ['WHY?', 'Shows the source, evidence, calculation, rule, assumptions and unknowns behind any value.'],
];
