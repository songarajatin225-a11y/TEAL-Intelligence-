import type { AnyRecord } from '../domain';
import type { CalcResult } from '../calculations/types';
import type { Graph } from './graph';

/**
 * WHY? engine (spec §64, §142). For any record (or calculated value) it assembles:
 * source · evidence · calculation · rule · assumption · unknown.
 */
export interface WhyItem {
  kind: 'Source' | 'Evidence' | 'Calculation' | 'Rule' | 'Assumption' | 'Unknown' | 'Provenance';
  title: string;
  detail: string;
  ref?: string;
  status?: string;
}

const UNKNOWN_SKIP = new Set(['description', 'notes', 'tags', 'links', 'owner', 'next_action', 'created_at', 'updated_at', 'version', 'status']);

export function whyForRecord(r: AnyRecord, g?: Graph): WhyItem[] {
  const out: WhyItem[] = [];
  const p = r.provenance;
  out.push({ kind: 'Provenance', title: `${r.data_type} · ${p?.verification_status ?? 'UNKNOWN'}`, detail: [p?.document, p?.section, p?.page ? `p. ${p.page}` : '', p?.confidence ? `confidence ${p.confidence}` : ''].filter(Boolean).join(' · ') || 'No document reference recorded', status: p?.verification_status });
  if (p?.source_id) {
    const s = g?.byId.get(p.source_id);
    out.push({ kind: 'Source', title: s ? s.name : p.source_id, detail: s?.description ?? 'Source record', ref: p.source_id });
  }
  if (p?.source_url) out.push({ kind: 'Source', title: 'Source URL', detail: p.source_url });
  if (p?.note) out.push({ kind: 'Assumption', title: 'Provenance note', detail: p.note });
  if (g) {
    for (const ev of g.byId.values()) {
      if (ev.entity === 'evidence' && (ev as { entity_id?: string }).entity_id === r.id) {
        const e = ev as unknown as { claim: string; section?: string; document?: string; excerpt?: string; verification_status: string };
        out.push({ kind: 'Evidence', title: e.claim, detail: [e.document, e.section].filter(Boolean).join(' — ') + (e.excerpt ? `\n“${e.excerpt}”` : ''), ref: ev.id, status: e.verification_status });
      }
    }
  }
  for (const a of ((r as { assumptions?: string[] }).assumptions ?? [])) out.push({ kind: 'Assumption', title: 'Assumption', detail: a });
  if (r.entity === 'rule') out.push({ kind: 'Rule', title: r.name, detail: String((r as { why?: string }).why ?? '') });
  // Unknowns: explicit nulls in the record
  const unknowns = Object.entries(r)
    .filter(([k, v]) => v === null && !UNKNOWN_SKIP.has(k) && !k.startsWith('__'))
    .map(([k]) => k.replace(/_/g, ' '));
  if (unknowns.length) out.push({ kind: 'Unknown', title: `${unknowns.length} field(s) UNKNOWN`, detail: unknowns.join(', ') });
  return out;
}

export function whyForCalc(c: CalcResult): WhyItem[] {
  const out: WhyItem[] = [
    {
      kind: 'Calculation',
      title: `${c.label} = ${c.value == null ? 'UNKNOWN' : c.value.toPrecision(4)} ${c.unit}`,
      detail: `${c.formula}\n${c.inputs.map((i) => `${i.symbol} (${i.label}) = ${i.value ?? 'UNKNOWN'} ${i.unit}`).join('\n')}`,
      status: c.status,
    },
    { kind: 'Source', title: c.source.citation, detail: c.source.formula_id ? `Formula catalogue ${c.source.formula_id}` : '', ref: c.source.ref },
  ];
  for (const a of c.assumptions) out.push({ kind: 'Assumption', title: 'Assumption', detail: a });
  for (const w of c.warnings) out.push({ kind: 'Unknown', title: 'Warning', detail: w });
  return out;
}
