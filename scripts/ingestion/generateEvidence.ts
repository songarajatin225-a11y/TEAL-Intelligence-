/**
 * GENERATE EVIDENCE (spec §63, §100): one evidence record per ingested field value — claim,
 * source, document, row, original excerpt, retrieval date, verification SOURCE_DOCUMENTED.
 */
import type { AnyRecord } from '../../src/domain';
import type { SourceManifest } from './manifest';
import { slug, sourceIdFor, type Candidate } from './normalizeProduct';

const show = (v: unknown) => (v && typeof v === 'object' && 'value' in (v as object) ? `${(v as { value: unknown }).value ?? 'UNKNOWN'} ${(v as { unit?: string }).unit ?? ''}`.trim() : Array.isArray(v) ? v.join(', ') : String(v));

export function generateEvidence(c: Candidate, m: SourceManifest, retrievedAt: string): AnyRecord[] {
  const r = c.record as Record<string, unknown>;
  return Object.entries(c.row.excerpts).map(
    ([field, excerpt]) =>
      ({
        id: `evd-ing-${slug(`${m.id}-${String(r.id).replace(/^[a-z]+-/, '')}-${field}`)}`,
        entity: 'evidence',
        name: `${String(r.name)} — ${field}`,
        claim: `${String(r.name)}: ${field} = ${show(r[field])}`,
        entity_id: String(r.id),
        source_id: sourceIdFor(m),
        ...(m.kind === 'http' ? { source_url: m.location } : {}),
        document: m.name,
        section: `row ${c.row.index + 1}`,
        excerpt: excerpt.slice(0, 500),
        retrieved_at: retrievedAt.slice(0, 10),
        verification_status: 'SOURCE_DOCUMENTED',
        confidence: excerpt.startsWith('manifest constant') ? 'LOW' : 'MEDIUM',
        data_type: m.data_type,
        provenance: { source_id: sourceIdFor(m), verification_status: 'SOURCE_DOCUMENTED', retrieved_at: retrievedAt.slice(0, 10) },
        tags: ['ingested', m.id],
      }) as AnyRecord,
  );
}
