import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Select } from '../../components/ui';
import type { Configuration } from '../../domain/entities';
import { useEngine, useRecords } from '../../hooks/useData';
import { workspaceDb } from '../../repositories/workspaceDb';
import type { ConfiguratorEngine } from '../configurator/engine';
import { stateFromConfiguration } from '../configurator/ConfiguratorPage';

const LANES = ['Input', 'Handling', 'Positioning', 'Process', 'Inspection', 'Output'] as const;
const LAYERS = ['Controls', 'Safety', 'Utilities', 'Data'] as const;
const CONN = { Mechanical: '#6b7d87', Electrical: '#b8800c', Pneumatic: '#2a5db0', Vacuum: '#7a6fb0', Network: '#00838a', Data: '#1b7f5a', Safety: '#b3261e' } as const;
type ConnType = keyof typeof CONN;
export const NODE_TYPES = ['Laser', 'Optics', 'Galvo', 'Motion', 'Robot', 'Vision', 'PLC', 'IPC', 'HMI', 'Safety', 'Fixture', 'Conveyor', 'Chiller', 'Fume extraction', 'Inspection', 'MES'] as const;

interface Node {
  id: string;
  label: string;
  type: string;
  lane: string;
  x: number;
  y: number;
}
interface Edge {
  from: string;
  to: string;
  type: ConnType;
}

const MODULE_LANE: Record<string, [string, string]> = {
  conveyor: ['Input', 'Conveyor'], magazine: ['Input', 'Fixture'], traytwr: ['Input', 'Fixture'], feeder: ['Input', 'Fixture'], r2r: ['Input', 'Conveyor'],
  robot6: ['Handling', 'Robot'], cobotld: ['Handling', 'Robot'], shuttle: ['Positioning', 'Motion'], rotoidx: ['Positioning', 'Motion'], turntbl: ['Positioning', 'Motion'], rotary: ['Positioning', 'Motion'],
  visfid: ['Positioning', 'Vision'], autofoc: ['Process', 'Optics'], scan3d: ['Process', 'Galvo'], wobble: ['Process', 'Optics'], gascon: ['Utilities', 'Chiller'],
  visver: ['Inspection', 'Vision'], weldmon: ['Inspection', 'Inspection'], oct: ['Inspection', 'Inspection'], seamtrk: ['Inspection', 'Vision'], reject: ['Output', 'Fixture'],
  fume: ['Utilities', 'Fume extraction'], cleanrm: ['Safety', 'Safety'], dryroom: ['Safety', 'Safety'], glovebx: ['Safety', 'Safety'], cepath: ['Safety', 'Safety'],
  mes: ['Data', 'MES'], secsgem: ['Data', 'MES'], connect: ['Data', 'IPC'], iqoqpq: ['Data', 'IPC'],
};

export function deriveArchitecture(e: ConfiguratorEngine, c: Configuration): { nodes: Node[]; edges: Edge[] } {
  const s = stateFromConfiguration(c);
  const p = e.product(s);
  const nodes: Node[] = [];
  const add = (id: string, label: string, type: string, lane: string) => nodes.push({ id, label, type, lane, x: 0, y: 0 });
  add('laser', `${e.sources.get(s.sourceKey ?? '')?.name ?? 'Laser'} ${s.powerW ?? ''} W`, 'Laser', 'Process');
  add('head', p?.delivery === 'robot' ? 'Process head on robot' : p?.delivery === 'gantry' ? 'Gantry head' : 'Galvo scan head', 'Galvo', 'Process');
  add('lens', e.lenses.get(s.lensKey ?? '')?.name ?? 'Objective', 'Optics', 'Process');
  add('fixture', 'Fixture / nest', 'Fixture', 'Positioning');
  add('plc', 'Safety PLC', 'PLC', 'Controls');
  add('ipc', `IPC (${e.modules.get(s.software ?? '')?.name ?? 'LaserSuite'})`, 'IPC', 'Controls');
  add('hmi', 'HMI', 'HMI', 'Controls');
  add('enclosure', 'Class 1 enclosure + interlocks', 'Safety', 'Safety');
  add('chiller', 'Cooling', 'Chiller', 'Utilities');
  for (const k of [...s.modules, ...s.extras]) {
    const m = e.modules.get(k);
    const [lane, type] = MODULE_LANE[k] ?? ['Process', 'Fixture'];
    if (m) add(`m-${k}`, m.name, type, lane);
  }
  if (!nodes.some((n) => n.lane === 'Input')) add('manual-in', 'Manual load', 'Fixture', 'Input');
  if (!nodes.some((n) => n.lane === 'Output')) add('manual-out', 'Manual unload', 'Fixture', 'Output');
  // layout: lanes as columns (flow) and layers as a bottom band
  const col = (lane: string) => (LANES as readonly string[]).indexOf(lane);
  const counts = new Map<string, number>();
  for (const n of nodes) {
    const i = counts.get(n.lane) ?? 0;
    counts.set(n.lane, i + 1);
    if (col(n.lane) >= 0) {
      n.x = 20 + col(n.lane) * 150;
      n.y = 60 + i * 58;
    } else {
      n.x = 20 + (LAYERS as readonly string[]).indexOf(n.lane) * 225 + (i % 2) * 110;
      n.y = 400 + Math.floor(i / 2) * 52;
    }
  }
  const edges: Edge[] = [];
  const ids = new Set(nodes.map((n) => n.id));
  const link = (a: string, b: string, t: ConnType) => ids.has(a) && ids.has(b) && edges.push({ from: a, to: b, type: t });
  const byLane = (l: string) => nodes.filter((n) => n.lane === l).map((n) => n.id);
  for (let i = 0; i < LANES.length - 1; i++) {
    const a = byLane(LANES[i])[0];
    const b = byLane(LANES[i + 1])[0];
    if (a && b) link(a, b, 'Mechanical');
  }
  link('laser', 'head', 'Mechanical');
  link('head', 'lens', 'Mechanical');
  link('plc', 'laser', 'Safety');
  link('plc', 'enclosure', 'Safety');
  link('ipc', 'laser', 'Network');
  link('ipc', 'head', 'Network');
  link('ipc', 'hmi', 'Network');
  link('plc', 'ipc', 'Network');
  link('chiller', 'laser', 'Electrical');
  for (const n of nodes.filter((x) => x.type === 'Vision' || x.type === 'Inspection')) link('ipc', n.id, 'Data');
  for (const n of nodes.filter((x) => x.type === 'MES')) link('ipc', n.id, 'Data');
  for (const n of nodes.filter((x) => x.type === 'Motion' || x.type === 'Robot' || x.type === 'Conveyor')) link('plc', n.id, 'Network');
  if (ids.has('m-fume')) link('m-fume', 'head', 'Pneumatic');
  return { nodes, edges };
}

/** MACHINE ARCHITECTURE BUILDER + CANVAS (spec §40–§41). Layout is stored in this browser. */
export default function ArchitecturePage() {
  const [params, setParams] = useSearchParams();
  const configs = useRecords<Configuration>('configuration');
  const e = useEngine();
  const cfgId = params.get('cfg') ?? configs[0]?.id ?? '';
  const cfg = configs.find((c) => c.id === cfgId);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [conn, setConn] = useState<ConnType>('Network');
  const [newType, setNewType] = useState<string>('Vision');
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!cfg || !e) return;
    workspaceDb()
      .prefs.get(`arch:${cfg.id}`)
      .then((p) => {
        const saved = p?.value as { nodes: Node[]; edges: Edge[] } | undefined;
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
  const save = () => cfg && void workspaceDb().prefs.put({ key: `arch:${cfg.id}`, value: { nodes, edges } });

  if (!configs.length) return <EmptyState title="No configurations" explain="Create a configuration in Configurator 2.0 first; the architecture is derived from it." />;
  return (
    <div>
      <PageHeader eyebrow="Machines" title="Machine architecture builder" subtitle="Input → handling → positioning → process → inspection → output, with controls, safety, utilities and data layers. Derived from the configuration; drag nodes, add nodes and typed connections." />
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
        <div className="mt-1 flex flex-wrap gap-2 text-[11.5px]">
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
