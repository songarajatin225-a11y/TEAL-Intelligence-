import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Select } from '../../components/ui';
import type { Configuration } from '../../domain/entities';
import { useEngine, useRecords } from '../../hooks/useData';
import { DatabaseService } from '../../services/database';
import { CONN, deriveArchitecture, LANES, LAYERS, NODE_TYPES, type ArchEdge, type ArchNode, type ConnType } from './architecture';
export { architectureFromState, deriveArchitecture, NODE_TYPES, type ArchEdge, type ArchNode } from './architecture';


/** MACHINE ARCHITECTURE BUILDER + CANVAS (spec §40–§41). Layout is stored in this browser. */
export default function ArchitecturePage() {
  const [params, setParams] = useSearchParams();
  const configs = useRecords<Configuration>('configuration');
  const e = useEngine();
  const cfgId = params.get('cfg') ?? configs[0]?.id ?? '';
  const cfg = configs.find((c) => c.id === cfgId);
  const [nodes, setNodes] = useState<ArchNode[]>([]);
  const [edges, setEdges] = useState<ArchEdge[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [conn, setConn] = useState<ConnType>('Network');
  const [newType, setNewType] = useState<string>('Vision');
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!cfg || !e) return;
    DatabaseService.getSetting<{ nodes: ArchNode[]; edges: ArchEdge[] }>(`arch:${cfg.id}`)
      .then((saved) => {
        const d = saved ?? deriveArchitecture(e, cfg);
        setNodes(d.nodes);
        setEdges(d.edges);
      })
      .catch(() => {
        const d = deriveArchitecture(e, cfg);
        setNodes(d.nodes);
        setEdges(d.edges);
      });
  }, [cfg, e]);

  const pt = (ev: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * 920, y: ((ev.clientY - r.top) / r.height) * 560 };
  };
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const save = () => cfg && void DatabaseService.setSetting(`arch:${cfg.id}`, { nodes, edges });

  if (!configs.length) return <EmptyState title="No configurations" explain="Create a configuration in Configurator 2.0 first; the architecture is derived from it." />;
  return (
    <div>
      <PageHeader eyebrow="Machines" title="Architecture" subtitle="Input → handling → positioning → process → inspection → output, with controls, safety, utilities and data layers. Derived from the configuration; drag nodes, add nodes and typed connections." />
      <Notice tone="draft">Canvas layout is saved in this browser only (workspace preferences). It is an architecture sketch, not a released design.</Notice>
      <div className="my-2 flex flex-wrap items-center gap-2">
        <Select aria-label="Configuration" value={cfgId} onChange={(ev) => setParams({ cfg: ev.target.value })} className="w-96">
          {configs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Node type" value={newType} onChange={(ev) => setNewType(ev.target.value)} className="w-40">
          {NODE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        <Button size="sm" onClick={() => setNodes([...nodes, { id: `n${Date.now()}`, label: newType, type: newType, lane: 'Process', x: 400, y: 300 }])}>
          Add node
        </Button>
        <Select aria-label="Connection type" value={conn} onChange={(ev) => setConn(ev.target.value as ConnType)} className="w-36">
          {Object.keys(CONN).map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        <Button size="sm" disabled={sel.length !== 2} onClick={() => (setEdges([...edges, { from: sel[0], to: sel[1], type: conn }]), setSel([]))}>
          Connect selected ({sel.length}/2)
        </Button>
        <Button size="sm" disabled={!sel.length} onClick={() => (setNodes(nodes.filter((n) => !sel.includes(n.id))), setEdges(edges.filter((x) => !sel.includes(x.from) && !sel.includes(x.to))), setSel([]))}>
          Delete selected
        </Button>
        <Button size="sm" onClick={() => cfg && e && (setNodes(deriveArchitecture(e, cfg).nodes), setEdges(deriveArchitecture(e, cfg).edges))}>
          Re-derive
        </Button>
        <Button size="sm" variant="primary" onClick={save}>
          Save layout
        </Button>
      </div>
      <Card>
        <svg
          ref={svgRef}
          viewBox="0 0 920 560"
          className="w-full touch-none select-none"
          role="img"
          aria-label="Machine architecture canvas"
          onPointerMove={(ev) => {
            if (!drag.current) return;
            const p = pt(ev);
            const d = drag.current;
            setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x: p.x - d.dx, y: p.y - d.dy } : n)));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerLeave={() => (drag.current = null)}
        >
          {LANES.map((l, i) => (
            <g key={l}>
              <rect x={10 + i * 150} y={20} width={140} height={360} fill="var(--c-panel-2)" stroke="var(--c-line)" />
              <text x={80 + i * 150} y={38} fontSize={11} fontWeight={600} fill="var(--c-ink-3)" textAnchor="middle">
                {l.toUpperCase()}
              </text>
            </g>
          ))}
          {LAYERS.map((l, i) => (
            <g key={l}>
              <rect x={10 + i * 225} y={388} width={215} height={165} fill="var(--c-panel-2)" stroke="var(--c-line)" />
              <text x={20 + i * 225} y={402} fontSize={10.5} fontWeight={600} fill="var(--c-ink-3)">
                {l.toUpperCase()}
              </text>
            </g>
          ))}
          {edges.map((ed, i) => {
            const a = byId.get(ed.from);
            const b = byId.get(ed.to);
            if (!a || !b) return null;
            return <line key={i} x1={a.x + 60} y1={a.y + 18} x2={b.x + 60} y2={b.y + 18} stroke={CONN[ed.type]} strokeWidth={1.6} strokeDasharray={ed.type === 'Safety' ? '5 3' : undefined} />;
          })}
          {nodes.map((n) => (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              className="cursor-move"
              onPointerDown={(ev) => {
                const p = pt(ev);
                drag.current = { id: n.id, dx: p.x - n.x, dy: p.y - n.y };
              }}
              onDoubleClick={() => setSel((s) => (s.includes(n.id) ? s.filter((x) => x !== n.id) : [...s, n.id].slice(-2)))}
            >
              <rect width={120} height={36} rx={4} fill="var(--c-panel)" stroke={sel.includes(n.id) ? 'var(--c-accent)' : 'var(--c-ink-3)'} strokeWidth={sel.includes(n.id) ? 2.5 : 1} />
              <text x={6} y={13} fontSize={8.5} fill="var(--c-accent-2)">
                {n.type}
              </text>
              <text x={6} y={27} fontSize={9.5} fill="var(--c-ink)">
                {n.label.slice(0, 22)}
              </text>
            </g>
          ))}
        </svg>
        <div className="mt-1 flex flex-wrap gap-2 text-meta">
          {Object.entries(CONN).map(([k, c]) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span className="inline-block h-0.5 w-5" style={{ background: c }} /> {k}
            </span>
          ))}
          <Badge>double-click a node to select</Badge>
        </div>
      </Card>
    </div>
  );
}
