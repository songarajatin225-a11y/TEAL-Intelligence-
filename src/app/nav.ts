import {
  Activity,
  Boxes,
  Briefcase,
  Building2,
  Calculator,
  ClipboardCheck,
  Cog,
  Cpu,
  DollarSign,
  FlaskConical,
  Gauge,
  Globe2,
  LayoutDashboard,
  Library,
  Map as MapIcon,
  Microscope,
  Package,
  Radar,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  children?: { label: string; to: string }[];
}

/** Primary navigation — spec §117, in order. Children cover the 58 platform modules (§11). */
export const NAV: NavItem[] = [
  { label: 'Command Center', to: '/', icon: LayoutDashboard, children: [{ label: 'Dashboards', to: '/dashboards' }] },
  { label: 'Product Manager', to: '/pm', icon: Briefcase, children: [{ label: 'Activities', to: '/activities' }] },
  { label: 'Products', to: '/products', icon: Package, children: [{ label: 'Product Configurator 2.0', to: '/configurator' }, { label: 'Platformization', to: '/platformization' }] },
  { label: 'Customers', to: '/customers', icon: Users, children: [{ label: 'Companies', to: '/companies' }] },
  { label: 'Opportunities', to: '/opportunities', icon: Zap, children: [{ label: 'Inquiry → Product', to: '/inquiry' }, { label: 'Requirements', to: '/requirements' }, { label: 'Traceability', to: '/traceability' }] },
  { label: 'Applications', to: '/applications', icon: Microscope, children: [{ label: 'Materials', to: '/materials' }] },
  { label: 'Laser', to: '/laser', icon: Radar, children: [{ label: 'Optics', to: '/optics' }, { label: 'Galvo / scanners', to: '/galvo' }, { label: 'Calculators', to: '/calculators' }] },
  { label: 'Process', to: '/process', icon: FlaskConical },
  { label: 'POC / DOE', to: '/poc', icon: FlaskConical, children: [{ label: 'DOE', to: '/doe' }] },
  { label: 'Machines', to: '/machines', icon: Cog, children: [{ label: 'Architecture builder', to: '/architecture' }] },
  { label: 'Modules', to: '/modules', icon: Boxes, children: [{ label: 'Reuse engine', to: '/reuse' }] },
  { label: 'Semiconductor', to: '/semiconductor', icon: Cpu, children: [{ label: 'Equipment buyer', to: '/equipment-buyer' }] },
  { label: 'Suppliers', to: '/suppliers', icon: Truck, children: [{ label: 'RFQ', to: '/rfq' }, { label: 'Procurement', to: '/procurement' }] },
  { label: 'BOM', to: '/bom', icon: Package, children: [{ label: 'Item master', to: '/items' }] },
  { label: 'Cost', to: '/cost', icon: DollarSign },
  { label: 'Projects', to: '/projects', icon: Briefcase },
  { label: 'G0–G10', to: '/gates', icon: ClipboardCheck },
  { label: 'Quality / Risk', to: '/quality', icon: ShieldCheck, children: [{ label: 'Decision records', to: '/decisions' }, { label: 'Change requests', to: '/changes' }] },
  { label: 'FAT / SAT', to: '/fat-sat', icon: ClipboardCheck, children: [{ label: 'Production release', to: '/production-release' }] },
  { label: 'Localization', to: '/localization', icon: MapIcon },
  { label: 'Technology', to: '/technology', icon: Radar },
  { label: 'Roadmap', to: '/roadmap', icon: Gauge },
  { label: 'Global Intelligence', to: '/global', icon: Globe2 },
  { label: 'Knowledge', to: '/knowledge', icon: Library, children: [{ label: 'Engineering search', to: '/search' }, { label: 'Engineering memory', to: '/memory' }, { label: 'Knowledge graph', to: '/graph' }, { label: 'Evidence ledger', to: '/evidence' }, { label: 'Lessons learned', to: '/lessons' }, { label: 'AI context / prompts', to: '/ai' }, { label: 'Formulas', to: '/formulas' }] },
  { label: 'Service', to: '/service', icon: Wrench },
  { label: 'Admin', to: '/admin', icon: Activity, children: [{ label: 'Data quality', to: '/data-quality' }, { label: 'Reports', to: '/reports' }, { label: 'Legacy apps', to: '/legacy' }] },
];

export const CALC_ICON = Calculator;
export const COMPANY_ICON = Building2;
