import type { AnyRecord } from '../domain';
import type { BomLine, ItemMaster, Supplier } from '../domain/entities';
import type { ConfigState, ConfiguratorEngine } from '../features/configurator/engine';
import { architectureFromState } from '../features/machines/architecture';
import { bomLinesFromConfig } from './bomGen';

/**
 * PRODUCT ARCHITECTURE ENGINE (final master prompt §15, §59):
 *   PRODUCT → SYSTEM → SUBSYSTEM → MODULE → COMPONENT (→ specification → supplier → cost)
 * Systems group the architecture builder's lanes; subsystems are its node types; modules are the
 * configured modules; components are the configuration's BOM lines plus component-master items of
 * the matching category (their prices and vendors carry their own trust labels).
 */
export const SYSTEMS: Record<string, string[]> = {
  'Process system': ['Process'],
  'Handling system': ['Input', 'Handling', 'Positioning', 'Output'],
  'Inspection system': ['Inspection'],
  'Control system': ['Controls', 'Data'],
  'Safety & utilities': ['Safety', 'Utilities'],
};

const CATEGORY_FOR: Record<string, RegExp> = {
  Laser: /laser source/i,
  Optics: /optic|scanner/i,
  Galvo: /scanner/i,
  Motion: /motion/i,
  Conveyor: /motion/i,
  Robot: /robotic/i,
  Vision: /vision|sensor/i,
  Inspection: /vision|sensor/i,
  PLC: /electrical/i,
  IPC: /electrical/i,
  HMI: /electrical/i,
  Safety: /safety/i,
  Fixture: /hardware|raw material|pneumatic/i,
  Chiller: /^$/,
  'Fume extraction': /^$/,
  MES: /^$/,
};

export interface ArchComponent {
  kind: 'bom' | 'item';
  id: string;
  name: string;
  spec?: string;
  supplier?: { id?: string; name: string };
  cost: number | null;
  currency: string;
  basis: string;
  record?: AnyRecord;
}
export interface ArchModule {
  id: string;
  name: string;
  moduleId?: string;
  components: ArchComponent[];
}
export interface ArchSubsystem {
  type: string;
  modules: ArchModule[];
}
export interface ArchSystem {
  name: string;
  subsystems: ArchSubsystem[];
}

export function productArchitecture(e: ConfiguratorEngine, s: ConfigState, records: AnyRecord[]): ArchSystem[] {
  const arch = architectureFromState(e, s);
  const bom = bomLinesFromConfig(e, s);
  const items = records.filter((r) => r.entity === 'component') as unknown as (ItemMaster & AnyRecord)[];
  const suppliers = records.filter((r) => r.entity === 'supplier') as unknown as Supplier[];
  const supplierFor = (vendor?: string) => {
    if (!vendor) return undefined;
    const sp = suppliers.find((x) => x.name.toLowerCase() === vendor.toLowerCase());
    return { id: sp?.id, name: vendor };
  };
  const bomFor = (nodeId: string, type: string): BomLine[] => {
    if (nodeId === 'laser') return bom.filter((l) => /^laser source/i.test(l.description));
    if (type === 'Optics' && nodeId === 'lens') return bom.filter((l) => l.level === 'Component');
    if (nodeId.startsWith('m-')) return bom.filter((l) => l.module_id === `mod-${nodeId.slice(2)}`);
    return [];
  };
  const out: ArchSystem[] = [];
  for (const [system, lanes] of Object.entries(SYSTEMS)) {
    const nodes = arch.nodes.filter((n) => lanes.includes(n.lane));
    if (!nodes.length) continue;
    const types = [...new Set(nodes.map((n) => n.type))];
    out.push({
      name: system,
      subsystems: types.map((type) => {
        const re = CATEGORY_FOR[type];
        const catalogue = re ? items.filter((i) => re.test(i.category)) : [];
        return {
          type,
          modules: nodes
            .filter((n) => n.type === type)
            .map((n) => ({
              id: n.id,
              name: n.label,
              moduleId: n.id.startsWith('m-') ? `mod-${n.id.slice(2)}` : undefined,
              components: [
                ...bomFor(n.id, type).map<ArchComponent>((l) => ({ kind: 'bom', id: l.line_id, name: l.description, cost: l.unit_cost, currency: l.currency, basis: l.cost_basis, supplier: supplierFor(l.supplier) })),
                ...catalogue.slice(0, 4).map<ArchComponent>((i) => ({ kind: 'item', id: i.id, name: i.name, spec: i.spec, supplier: supplierFor(i.vendor), cost: i.price, currency: i.currency, basis: i.price_basis, record: i })),
              ],
            })),
        };
      }),
    });
  }
  return out;
}
