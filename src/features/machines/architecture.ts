import type { Configuration } from '../../domain/entities';
import type { ConfigState, ConfiguratorEngine } from '../configurator/engine';
import { stateFromConfiguration } from '../configurator/state';

/*
 * MACHINE ARCHITECTURE DERIVATION (pure): configurator state → nodes by process lane / control layer
 * and typed connections. Used by the architecture canvas, the product-architecture tree and the
 * application engine.
 */
export const LANES = ['Input', 'Handling', 'Positioning', 'Process', 'Inspection', 'Output'] as const;
export const LAYERS = ['Controls', 'Safety', 'Utilities', 'Data'] as const;
export const CONN = { Mechanical: '#6b7d87', Electrical: '#b8800c', Pneumatic: '#2a5db0', Vacuum: '#7a6fb0', Network: '#00838a', Data: '#1b7f5a', Safety: '#b3261e' } as const;
export type ConnType = keyof typeof CONN;
export const NODE_TYPES = ['Laser', 'Optics', 'Galvo', 'Motion', 'Robot', 'Vision', 'PLC', 'IPC', 'HMI', 'Safety', 'Fixture', 'Conveyor', 'Chiller', 'Fume extraction', 'Inspection', 'MES'] as const;

export interface ArchNode {
  id: string;
  label: string;
  type: string;
  lane: string;
  x: number;
  y: number;
}
export interface ArchEdge {
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

export function deriveArchitecture(e: ConfiguratorEngine, c: Configuration): { nodes: ArchNode[]; edges: ArchEdge[] } {
  return architectureFromState(e, stateFromConfiguration(c));
}

/** Machine architecture (nodes by process lane / control layer) derived from a configurator state. */
export function architectureFromState(e: ConfiguratorEngine, s: ConfigState): { nodes: ArchNode[]; edges: ArchEdge[] } {
  const p = e.product(s);
  const nodes: ArchNode[] = [];
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
  const edges: ArchEdge[] = [];
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
