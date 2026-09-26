import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { Card, Input, PageHeader, Select, Stat } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import { neighbours } from '../../services/graph';

const COLORS: Record<string, string> = {
  product: '#00838a', configuration: '#12838c', module: '#4fbac1', laser_source: '#e0552b', optic: '#b8800c', application: '#7a6fb0', material: '#8a9ba5', customer: '#2a5db0', opportunity: '#2a5db0', project: '#1b7f5a', requirement: '#6b7d87', poc: '#9a6ba8', doe: '#9a6ba8', supplier: '#c46a3f', company: '#c46a3f', source: '#3f525c', evidence: '#1b7f5a', risk: '#b3261e', bom: '#0b6e75', cost_model: '#0b6e75',
};

/** KNOWLEDGE GRAPH (spec §80): radial neighbourhood explorer over the digital thread. */
export default function GraphPage() {
  const { graph, records } = useData();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const [filter, setFilter] = useState('');
  const [hover, setHoverState] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const setHover = (id: string | null) => {
    setHoverState(id);
    if (id) setLast(id);
  };
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const focus = params.get('id') ?? 'prd-semispm';
  const center = graph.byId.get(focus);
  const ns = useMemo(() => {
    const seen = new Set<string>();
    return neighbours(graph, focus).filter((n) => !seen.has(n.record.id) && seen.add(n.record.id)).slice(0, 60);
  }, [graph, focus]);
  const types = useMemo(() => [...new Set(ns.map((n) => n.record.entity))].sort(), [ns]);
  const toggleType = (t: string) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  const dimmed = (id: string, entity: string) => hidden.has(entity) || (hover != null && hover !== id);
  const hovered = last ? ns.find((n) => n.record.id === last) : undefined;
  const edgeCount = [...graph.out.values()].reduce((s, l) => s + l.length, 0);
  const W = 760;
  const H = 520;
  const cx = W / 2;
  const cy = H / 2;
  const options = records.filter((r) => !filter || r.name.toLowerCase().includes(filter.toLowerCase())).slice(0, 200);
  return (
    <div>
      <PageHeader eyebrow="Knowledge" title="Knowledge Graph" subtitle="Nodes: companies, products, applications, processes, materials, lasers, optics, modules, machines, suppliers, customers, requirements, POCs, BOMs, projects, evidence, sources, lessons. Edges: manufactures, uses, compatible_with, applies_to, built_from, supplied_by, tested_by, derived_from, similar_to, used_in, requires, validated_by, learned_from." />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Nodes" value={graph.byId.size} />
        <Stat label="Edges" value={edgeCount} />
        <Stat label="Broken references" value={graph.broken.length} tone={graph.broken.length ? 'bad' : 'ok'} />
        <Stat label="Neighbours of focus" value={ns.length} />
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        <Input aria-label="Filter records" placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56" />
        <Select aria-label="Focus record" value={focus} onChange={(e) => setParams({ id: e.target.value })} className="w-96">
          {options.map((r) => (
            <option key={r.id} value={r.id}>
              {ENTITY_BY_TYPE[r.entity]?.label}: {r.name}
            </option>
          ))}
        </Select>
      </div>
      <Card title={center ? `${ENTITY_BY_TYPE[center.entity]?.label}: ${center.name}` : focus}>
        <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Show or dim record types">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={!hidden.has(t)}
              onClick={() => toggleType(t)}
              className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-micro', hidden.has(t) ? 'border-line text-ink-3 opacity-60' : 'border-line-strong text-ink')}
            >
              <span className="size-2 rounded-full" style={{ background: COLORS[t] ?? '#6b7d87' }} aria-hidden />
              {ENTITY_BY_TYPE[t]?.plural ?? t} ({ns.filter((n) => n.record.entity === t).length})
            </button>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`Graph neighbourhood of ${center?.name}`} className="w-full">
          {ns.map((n, i) => {
            const a = (i / Math.max(1, ns.length)) * Math.PI * 2;
            const r = i % 2 ? 210 : 165;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r * 0.82;
            return (
              <g
                key={n.record.id}
                role="button"
                tabIndex={0}
                aria-label={`${ENTITY_BY_TYPE[n.record.entity]?.label ?? n.record.entity}: ${n.record.name} (${n.rel.replace(/_/g, ' ')}). Enter to re-centre`}
                className="cursor-pointer transition-opacity duration-150 focus:outline-none"
                style={{ opacity: dimmed(n.record.id, n.record.entity) ? 0.14 : 1 }}
                onMouseEnter={() => setHover(n.record.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n.record.id)}
                onBlur={() => setHover(null)}
                onClick={() => setParams({ id: n.record.id })}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setParams({ id: n.record.id }))}
              >
                <line x1={cx} y1={cy} x2={x} y2={y} stroke={hover === n.record.id ? 'var(--c-accent)' : 'var(--c-line)'} strokeWidth={hover === n.record.id ? 2 : 1} />
                <text x={(cx + x) / 2} y={(cy + y) / 2} fontSize={8} fill="var(--c-ink-3)" textAnchor="middle">
                  {n.direction === 'out' ? n.rel : `←${n.rel}`}
                </text>
                <circle cx={x} cy={y} r={hover === n.record.id ? 8 : 6} fill={COLORS[n.record.entity] ?? '#6b7d87'} />
                <text x={x} y={y - 9} fontSize={9.5} fill="var(--c-ink)" textAnchor="middle">
                  {n.record.name.slice(0, 26)}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={11} fill={COLORS[center?.entity ?? ''] ?? '#00838a'} onClick={() => center && nav(`/record/${center.id}`)} className="cursor-pointer" />
          <text x={cx} y={cy + 26} fontSize={11} fontWeight={600} fill="var(--c-ink)" textAnchor="middle">
            {center?.name.slice(0, 40)}
          </text>
        </svg>
        <p className="min-h-[1.5rem] text-meta" aria-live="polite">
          {hovered ? (
            <>
              <b>{hovered.record.name}</b> — {hovered.direction === 'out' ? `${center?.name} ${hovered.rel.replace(/_/g, ' ')} it` : `it ${hovered.rel.replace(/_/g, ' ')} ${center?.name}`} ·{' '}
              <Link to={`/record/${encodeURIComponent(hovered.record.id)}`} className="text-accent-2 hover:underline">
                open record
              </Link>
            </>
          ) : (
            <span className="text-ink-3">Hover or tab to a node to focus it (others dim); click or Enter to re-centre; click the centre to open the record. Toggle types above to dim them.</span>
          )}
        </p>
      </Card>
    </div>
  );
}
