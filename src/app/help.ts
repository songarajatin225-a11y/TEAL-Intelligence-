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
