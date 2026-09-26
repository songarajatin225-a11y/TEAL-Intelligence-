import { useMemo, useState } from 'react';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Card, EmptyState, PageHeader, Select, Stat } from '../../components/ui';
import type { AcceptanceProtocol, Bom, Module, Requirement } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { repo } from '../../repositories';
import { traceMatrix } from '../../services/traceability';

/** TRACEABILITY MATRIX (spec §39) with missing links. */
export default function TraceabilityPage() {
  const reqs = useRecords<Requirement>('requirement');
  const boms = useRecords<Bom>('bom');
  const protos = useRecords<AcceptanceProtocol>('acceptance');
  const modules = useRecords<Module>('module');
  const opps = [...new Set(reqs.map((r) => r.opportunity_id ?? r.project_id ?? ''))].filter(Boolean);
  const [scope, setScope] = useState('');
  const rows = useMemo(() => traceMatrix(reqs.filter((r) => !scope || r.opportunity_id === scope || r.project_id === scope), boms, protos), [reqs, boms, protos, scope]);
  const complete = rows.filter((r) => !r.missing.length).length;
  const linkModule = async (req: Requirement & { __origin?: unknown; __dataset?: unknown }, moduleId: string) => {
    const { __origin, __dataset, ...clean } = req;
    void __origin;
    void __dataset;
    const t = clean.trace ?? {};
    await repo().workspace.save({ ...clean, trace: { ...t, module_ids: [...new Set([...(t.module_ids ?? []), moduleId])] } } as unknown as Record<string, unknown>, 'Linked requirement to module');
  };
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Opportunities" title="Traceability" subtitle="Requirement → design feature → module → BOM → test → FAT → SAT. Links come from requirement.trace, BOM module ids and FAT/SAT tests generated from requirements." />
      <div className="flex flex-wrap items-end gap-2">
        <Select aria-label="Scope" value={scope} onChange={(e) => setScope(e.target.value)} className="w-96">
          <option value="">All requirements</option>
          {opps.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
        <Stat label="Requirements" value={rows.length} />
        <Stat label="Fully traced" value={complete} tone={complete === rows.length ? 'ok' : 'warn'} />
      </div>
      {!rows.length ? (
        <EmptyState title="No requirements" explain="Create requirements, or run Create product from inquiry." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase text-ink-3">
                  {['Requirement', 'Design / module', 'BOM', 'FAT', 'SAT', 'Missing links'].map((h) => (
                    <th key={h} className="px-1 py-1">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.req.id} className="border-t border-line/60 align-top">
                    <td className="max-w-[260px] px-1 py-1">
                      <RecordLink id={r.req.id} />
                      <div className="text-[11px] text-ink-3">{r.req.code}</div>
                    </td>
                    <td className="px-1 py-1">
                      {r.design.map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                      {r.modules.map((m) => (
                        <div key={m}>
                          <RecordLink id={m} />
                        </div>
                      ))}
                      <Select aria-label="Link module" value="" onChange={(e) => e.target.value && void linkModule(r.req as Requirement & { __origin?: unknown }, e.target.value)} className="mt-0.5 py-0.5 text-[11px]">
                        <option value="">+ module…</option>
                        {modules.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-1 py-1">{r.bomLines.length ? r.bomLines.map((l) => <div key={`${l.bom}-${l.line}`}>{l.line} {l.description.slice(0, 30)}</div>) : '—'}</td>
                    <td className="num px-1 py-1">{r.fat.length || '—'}</td>
                    <td className="num px-1 py-1">{r.sat.length || '—'}</td>
                    <td className="px-1 py-1">{r.missing.length ? r.missing.map((m) => <Badge key={m} tone="bad" className="mb-0.5 mr-0.5">{m}</Badge>) : <Badge tone="ok">complete</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
