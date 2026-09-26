import { useMemo, useState } from 'react';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Card, Chain, EmptyState, PageHeader, Select, Stat } from '../../components/ui';
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
  const projects = useRecords<{ gates: { gate_code: string; decision: string }[] }>('project');
  const machines = useRecords('machine');
  const lessons = useRecords('lesson');
  const needs = new Set(rows.map((r) => r.req.opportunity_id ?? r.req.project_id).filter(Boolean)).size;
  const cov = (n: number) => (!rows.length ? 'todo' : n === rows.length ? 'done' : n ? 'current' : 'gap') as 'todo' | 'done' | 'current' | 'gap';
  const released = projects.filter((p) => p.gates.some((g) => g.gate_code === 'G10' && g.decision.startsWith('GO'))).length;
  const linkModule = async (req: Requirement & { __origin?: unknown; __dataset?: unknown }, moduleId: string) => {
    const { __origin, __dataset, ...clean } = req;
    void __origin;
    void __dataset;
    const t = clean.trace ?? {};
    await repo().workspace.save({ ...clean, trace: { ...t, module_ids: [...new Set([...(t.module_ids ?? []), moduleId])] } } as unknown as Record<string, unknown>, 'Linked requirement to module');
  };
  return (
    <div className="space-y-3">
      <PageHeader title="Traceability" subtitle="From customer need to field lesson: every requirement is followed through design, BOM, test, FAT, SAT and production. Gaps are shown, never hidden." />
      <Card title="Engineering chain" description="Coverage across the selected requirements — dashed stages have gaps">
        <Chain
          label="Traceability chain"
          steps={[
            { label: 'Customer need', sub: `${needs} source${needs === 1 ? '' : 's'}`, to: '/opportunities', state: needs ? 'done' : 'todo' },
            { label: 'Requirement', sub: `${rows.length} total`, to: '/requirements', state: rows.length ? 'done' : 'todo' },
            { label: 'Design / module', sub: `${rows.filter((r) => r.modules.length || r.design.length).length}/${rows.length}`, state: cov(rows.filter((r) => r.modules.length || r.design.length).length) },
            { label: 'BOM line', sub: `${rows.filter((r) => r.bomLines.length).length}/${rows.length}`, to: '/bom', state: cov(rows.filter((r) => r.bomLines.length).length) },
            { label: 'FAT test', sub: `${rows.filter((r) => r.fat.length).length}/${rows.length}`, to: '/fat-sat', state: cov(rows.filter((r) => r.fat.length).length) },
            { label: 'SAT test', sub: `${rows.filter((r) => r.sat.length).length}/${rows.length}`, to: '/fat-sat', state: cov(rows.filter((r) => r.sat.length).length) },
            { label: 'Production', sub: `${released} released`, to: '/production-release', state: released ? 'done' : 'todo' },
            { label: 'Field', sub: `${machines.length} machines`, to: '/service', state: machines.length ? 'done' : 'todo' },
            { label: 'Lesson learned', sub: `${lessons.length}`, to: '/lessons', state: lessons.length ? 'done' : 'todo' },
          ]}
        />
      </Card>
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
            <table className="w-full text-meta">
              <thead>
                <tr className="text-left text-micro uppercase text-ink-3">
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
                      <div className="text-micro text-ink-3">{r.req.code}</div>
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
                      <Select aria-label="Link module" value="" onChange={(e) => e.target.value && void linkModule(r.req as Requirement & { __origin?: unknown }, e.target.value)} className="mt-0.5 py-0.5 text-micro">
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
