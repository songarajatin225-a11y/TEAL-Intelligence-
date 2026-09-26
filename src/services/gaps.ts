import type { Doe, Poc, Project, Requirement } from '../domain/entities';
import { linked, type Graph } from './graph';

/**
 * GAP ENGINE — "What is missing?" (spec §44, §141). Walks the digital thread around a record
 * and reports each expected link as present / partial / missing, with the action to close it.
 */
export type GapCategory = 'Requirements' | 'Process' | 'POC' | 'Module' | 'Supplier' | 'Technology' | 'Validation' | 'Certification' | 'Cost' | 'Documents' | 'Project';

export interface GapItem {
  category: GapCategory;
  item: string;
  status: 'present' | 'partial' | 'missing';
  detail: string;
  action?: string;
  refs?: string[];
}

const byOpp = (g: Graph, oppId: string, entity: string) => [...g.byId.values()].filter((r) => r.entity === entity && (r as { opportunity_id?: string }).opportunity_id === oppId);
const byField = (g: Graph, field: string, id: string, entity: string) => [...g.byId.values()].filter((r) => r.entity === entity && (r as Record<string, unknown>)[field] === id);

function reqChecks(reqs: Requirement[]): GapItem[] {
  if (!reqs.length) return [{ category: 'Requirements', item: 'Requirements (URS)', status: 'missing', detail: 'No requirements linked', action: 'Draft URS lines (Handbook Part 2) or run "Create product from inquiry"' }];
  const noAcc = reqs.filter((r) => !r.acceptance_criterion);
  const noVal = reqs.filter((r) => r.category === 'Performance' && !r.value);
  const items: GapItem[] = [{ category: 'Requirements', item: 'Requirements (URS)', status: 'present', detail: `${reqs.length} requirement(s)`, refs: reqs.map((r) => r.id) }];
  if (noAcc.length) items.push({ category: 'Requirements', item: 'Acceptance criteria', status: 'partial', detail: `${noAcc.length} of ${reqs.length} without an acceptance criterion`, action: 'Add measurable acceptance criteria (G0 approval criterion)', refs: noAcc.map((r) => r.id) });
  if (noVal.length) items.push({ category: 'Requirements', item: 'Performance values', status: 'missing', detail: `${noVal.length} performance requirement(s) without a value (e.g. UPH)`, action: 'Obtain values from the customer', refs: noVal.map((r) => r.id) });
  const signed = reqs.filter((r) => r.provenance?.verification_status === 'VERIFIED');
  items.push({ category: 'Validation', item: 'Customer-signed URS values', status: signed.length === reqs.length ? 'present' : 'missing', detail: `${signed.length}/${reqs.length} requirements VERIFIED`, action: 'G0 exit criterion: customer signs URS values' });
  return items;
}

function pocChecks(pocs: Poc[], does: Doe[]): GapItem[] {
  if (!pocs.length) return [{ category: 'POC', item: 'Proof of concept', status: 'missing', detail: 'No POC linked', action: 'Plan a POC on real samples (G1: process feasible on real samples)' }];
  const items: GapItem[] = [{ category: 'POC', item: 'Proof of concept', status: 'present', detail: pocs.map((p) => `${p.name} (${p.poc_status})`).join('; '), refs: pocs.map((p) => p.id) }];
  const measured = does.filter((d) => d.runs.some((r) => Object.values(r.results).some((v) => v != null)));
  items.push({ category: 'Process', item: 'Process data (DOE results)', status: measured.length ? 'partial' : 'missing', detail: measured.length ? `${measured.length} DOE(s) with measurements` : 'No measured DOE results', action: 'Run the DOE and record results' });
  const decided = pocs.filter((p) => p.decision !== 'Undecided');
  items.push({ category: 'Process', item: 'Process window / POC decision', status: decided.length ? 'present' : 'missing', detail: decided.length ? decided.map((p) => p.decision).join(', ') : 'No POC decision recorded', action: 'Record the POC decision with evidence' });
  return items;
}

export function whatIsMissing(g: Graph, id: string): GapItem[] {
  const r = g.byId.get(id);
  if (!r) return [];
  const items: GapItem[] = [];
  const oppId = r.entity === 'opportunity' ? r.id : ((r as { opportunity_id?: string }).opportunity_id ?? null);
  const productId = r.entity === 'product' ? r.id : ((r as { product_id?: string }).product_id ?? null);

  if (r.entity === 'opportunity' || r.entity === 'project') {
    const cust = (r as { customer_id?: string }).customer_id;
    items.push({ category: 'Project', item: 'Customer', status: cust && g.byId.has(cust) ? 'present' : 'missing', detail: cust ? String(g.byId.get(cust)?.name ?? cust) : 'No customer linked', action: 'Link or create the customer' });
  }
  if (oppId) {
    items.push(...reqChecks(byOpp(g, oppId, 'requirement') as Requirement[]));
    const pocs = byOpp(g, oppId, 'poc') as Poc[];
    items.push(...pocChecks(pocs, pocs.flatMap((p) => (p.doe_id && g.byId.get(p.doe_id) ? [g.byId.get(p.doe_id) as Doe] : []))));
    const cfgs = byOpp(g, oppId, 'configuration');
    items.push({ category: 'Module', item: 'Machine configuration', status: cfgs.length ? 'present' : 'missing', detail: cfgs.length ? cfgs.map((c) => c.name).join('; ') : 'No configuration', action: 'Configure a platform in Product Configurator 2.0', refs: cfgs.map((c) => c.id) });
    const cms = byOpp(g, oppId, 'cost_model');
    items.push({ category: 'Cost', item: 'Cost model', status: cms.length ? 'partial' : 'missing', detail: cms.length ? `${cms.length} cost model(s); check assumptions for UNKNOWN items` : 'No cost model', action: 'Build the cost model from the BOM' });
    const risks = byOpp(g, oppId, 'risk');
    items.push({ category: 'Validation', item: 'Risk register', status: risks.length ? 'present' : 'missing', detail: `${risks.length} risk(s)`, action: 'Record risks (G1 output: risk register)' });
  }
  if (r.entity === 'project') {
    const p = r as unknown as Project;
    items.push({ category: 'Project', item: 'Schedule', status: p.tasks.length ? 'present' : 'missing', detail: `${p.tasks.length} task(s)` });
    items.push({ category: 'Module', item: 'BOM', status: p.bom_id && g.byId.has(p.bom_id) ? 'present' : 'missing', detail: p.bom_id ?? 'No BOM linked', action: 'Generate BOM from configuration' });
    items.push({ category: 'Cost', item: 'Cost model', status: p.cost_model_id && g.byId.has(p.cost_model_id) ? 'present' : 'missing', detail: p.cost_model_id ?? 'No cost model linked' });
    const passed = p.gates.filter((x) => x.decision === 'GO' || x.decision === 'GO WITH CONDITIONS');
    items.push({ category: 'Validation', item: 'Gate reviews', status: passed.length ? 'partial' : 'missing', detail: `${passed.length}/11 gates passed`, action: 'Hold the next gate review with mandatory evidence' });
    const acc = byField(g, 'project_id', p.id, 'acceptance');
    items.push({ category: 'Validation', item: 'FAT protocol', status: acc.some((a) => (a as { phase?: string }).phase === 'FAT') ? 'present' : 'missing', detail: 'FAT protocol generated from requirements', action: 'Generate FAT protocol from requirements' });
    items.push({ category: 'Validation', item: 'SAT protocol', status: acc.some((a) => (a as { phase?: string }).phase === 'SAT') ? 'present' : 'missing', detail: 'SAT protocol', action: 'Generate SAT protocol' });
    const bom = p.bom_id ? (g.byId.get(p.bom_id) as { lines?: { supplier?: string; description: string; make_buy: string }[] } | undefined) : undefined;
    const noSup = (bom?.lines ?? []).filter((l) => l.make_buy === 'Buy' && !l.supplier);
    if (bom) items.push({ category: 'Supplier', item: 'Suppliers for bought items', status: noSup.length ? 'missing' : 'present', detail: noSup.length ? `${noSup.length} bought line(s) without a supplier` : 'All bought lines have a supplier', action: 'Create RFQ from the BOM' });
  }
  if (productId && g.byId.get(productId)) {
    const prod = g.byId.get(productId)!;
    const apps = linked(g, productId, 'application');
    if (r.entity === 'product') items.push({ category: 'Process', item: 'Applications', status: apps.length ? 'present' : 'missing', detail: `${apps.length} application(s)` });
    const pocs = [...g.byId.values()].filter((x) => x.entity === 'poc' && (x as { product_id?: string }).product_id === productId);
    if (r.entity === 'product') items.push(...pocChecks(pocs as Poc[], []));
    const lessons = linked(g, productId, 'lesson');
    items.push({ category: 'Documents', item: 'Lessons learned on this product', status: lessons.length ? 'present' : 'missing', detail: lessons.length ? `${lessons.length}` : 'None recorded', action: 'Capture lessons after FAT/SAT and field service' });
    const ev = [...g.byId.values()].filter((x) => x.entity === 'evidence' && (x as { entity_id?: string }).entity_id === productId);
    items.push({ category: 'Validation', item: 'Evidence for product claims', status: ev.length ? 'present' : 'missing', detail: ev.length ? `${ev.length} evidence record(s)` : `Specifications of ${prod.name} are SOURCE_DOCUMENTED via the legacy catalogue only`, action: 'Attach datasheet / test evidence' });
    items.push({ category: 'Certification', item: 'Certification records', status: 'missing', detail: 'No certification records in the OS (CE / UL / SEMI S2 …)', action: 'Record certifications with evidence' });
  }
  if (r.entity === 'configuration' || r.entity === 'product') {
    items.push({ category: 'Technology', item: 'Optics compatibility data', status: 'missing', detail: 'Coating, damage threshold and scanner aperture data not held → COMPATIBILITY UNKNOWN', action: 'Curate optic/galvo datasheets through the ingestion pipeline' });
  }
  if (r.entity === 'poc') {
    const p = r as unknown as Poc;
    const d = p.doe_id ? (g.byId.get(p.doe_id) as Doe | undefined) : undefined;
    items.push(...pocChecks([p], d ? [d] : []));
    items.push({ category: 'Process', item: 'Material', status: p.material_id ? 'present' : 'missing', detail: p.material_id ?? 'Material not identified' });
    items.push({ category: 'Process', item: 'Measurements', status: p.measurements?.length ? 'present' : 'missing', detail: `${p.measurements?.length ?? 0} measurement(s)` });
  }
  items.push({ category: 'Documents', item: 'Controlled documents', status: 'missing', detail: 'Document records (URS/FRS/drawings) are not yet managed in V1 — see roadmap P1', action: 'Store documents in the repository /docs or DMS and link them' });
  return items;
}
