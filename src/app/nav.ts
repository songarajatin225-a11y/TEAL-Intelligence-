import {
  Activity,
  BarChart3,
  Beaker,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  Calculator,
  CircuitBoard,
  Cog,
  ClipboardCheck,
  Compass,
  Cpu,
  Crosshair,
  DollarSign,
  Factory,
  FileSearch,
  FlaskConical,
  GitBranch,
  GitCompare,
  Globe2,
  Hammer,
  Home,
  Layers,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Map as MapIcon,
  Microscope,
  Network,
  Package,
  PackageSearch,
  Radar,
  Route,
  ScanLine,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Truck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { WorkspaceId } from './prefs';

/*
 * INFORMATION ARCHITECTURE (docs/07_UX_REDESIGN.md §2): ten domains → pages.
 * Every pre-redesign route is still reachable; the sidebar shows domains, not 56 flat links.
 */
export interface NavPage {
  label: string;
  to: string;
  icon: LucideIcon;
  /** one line shown in search / command palette / help */
  desc: string;
  keywords?: string;
}
export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  pages: NavPage[];
}

export const SECTIONS: NavSection[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    pages: [
      { label: 'Mission Control', to: '/', icon: LayoutDashboard, desc: 'What needs attention, what you are working on, what changed' },
      { label: 'Dashboards', to: '/dashboards', icon: BarChart3, desc: 'Management, engineering, procurement, quality and service views' },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    icon: Briefcase,
    pages: [
      { label: 'My Workspace', to: '/pm', icon: Target, desc: 'Today, follow-ups, meetings and next actions', keywords: 'product manager pm today' },
      { label: 'Activities', to: '/activities', icon: ListChecks, desc: 'Tasks, meetings, follow-ups and daily logs' },
      { label: 'Opportunities', to: '/opportunities', icon: Zap, desc: 'Customer pipeline from lead to won', keywords: 'pipeline deals' },
      { label: 'Customers', to: '/customers', icon: Users, desc: 'Customers, contacts and sites' },
      { label: 'Projects', to: '/projects', icon: Briefcase, desc: 'Delivery projects, schedules and gates' },
      { label: 'POCs', to: '/poc', icon: FlaskConical, desc: 'Proofs of concept on real customer samples', keywords: 'proof of concept samples trial' },
      { label: 'Product from Inquiry', to: '/inquiry', icon: Sparkles, desc: 'Turn a customer inquiry into a draft product package', keywords: 'create product inquiry flagship' },
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    icon: Cog,
    pages: [
      { label: 'Products', to: '/products', icon: Package, desc: 'TEAL platforms, product DNA and portfolio' },
      { label: 'Configurator', to: '/configurator', icon: Layers, desc: 'Configure a machine: source, optics, modules, price, physics' },
      { label: 'Platformization', to: '/platformization', icon: GitCompare, desc: 'Custom machine → standard platform' },
      { label: 'Applications', to: '/applications', icon: Microscope, desc: 'Applications by industry and process' },
      { label: 'Materials', to: '/materials', icon: Beaker, desc: 'Material properties and absorption' },
      { label: 'Requirements', to: '/requirements', icon: ClipboardCheck, desc: 'URS → SRS → design → test' },
      { label: 'Traceability', to: '/traceability', icon: Route, desc: 'Requirement → module → BOM → FAT → SAT' },
      { label: 'DOE Studies', to: '/doe', icon: GitBranch, desc: 'Design of experiments and process windows', keywords: 'design of experiments' },
      { label: 'Machines', to: '/machines', icon: Factory, desc: 'Saved configurations and serialized machines' },
      { label: 'Architecture', to: '/architecture', icon: Network, desc: 'Machine architecture builder' },
      { label: 'Modules', to: '/modules', icon: Boxes, desc: 'Reusable automation, vision and software modules' },
    ],
  },
  {
    id: 'laser',
    label: 'Laser',
    icon: Crosshair,
    pages: [
      { label: 'Laser Platform', to: '/laser', icon: Crosshair, desc: 'Beam path, sources, optics and process at a glance' },
      { label: 'Laser Sources', to: '/laser-sources', icon: Radar, desc: 'Source technologies and parameters', keywords: 'fiber mopa uv co2 green ultrafast 1064nm' },
      { label: 'Optics', to: '/optics', icon: ScanLine, desc: 'F-theta objectives and beam delivery optics', keywords: 'beam delivery lens' },
      { label: 'Galvo Scanners', to: '/galvo', icon: Crosshair, desc: 'Scan heads and galvanometer scanners' },
      { label: 'Process Engineering', to: '/process', icon: Beaker, desc: 'Process regime, parameters and window' },
      { label: 'Calculators', to: '/calculators', icon: Calculator, desc: 'Laser, automation, quality and cost formulas' },
      { label: 'Formulas', to: '/formulas', icon: BookOpen, desc: 'Handbook formula catalogue (177)' },
    ],
  },
  {
    id: 'supply',
    label: 'Supply Chain',
    icon: Truck,
    pages: [
      { label: 'Suppliers', to: '/suppliers', icon: Truck, desc: 'Supplier records and capabilities' },
      { label: 'Procurement', to: '/procurement', icon: PackageSearch, desc: 'Bought-out lines, lead times and risk' },
      { label: 'BOMs', to: '/bom', icon: Layers, desc: 'Bills of material by product and configuration' },
      { label: 'Components', to: '/items', icon: Package, desc: 'Component / item master with stock codes', keywords: 'item master' },
      { label: 'RFQs', to: '/rfq', icon: FileSearch, desc: 'Requests for quotation and quote comparison' },
      { label: 'Cost', to: '/cost', icon: DollarSign, desc: 'Cost models, TEAL cost sheet, scenarios, margins' },
    ],
  },
  {
    id: 'semiconductor',
    label: 'Semiconductor',
    icon: Cpu,
    pages: [
      { label: 'Semiconductor Intelligence', to: '/semiconductor', icon: CircuitBoard, desc: 'Value chain, process steps and laser relevance', keywords: 'atmp packaging wafer' },
      { label: 'Equipment Buyer', to: '/equipment-buyer', icon: Cpu, desc: 'Buyer criteria and cost of ownership' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: BookOpen,
    pages: [
      { label: 'Engineering Knowledge', to: '/knowledge', icon: BookOpen, desc: 'Laser, automation and semiconductor handbooks', keywords: 'handbook library' },
      { label: 'Search', to: '/search', icon: Search, desc: 'Search everything' },
      { label: 'Evidence', to: '/evidence', icon: FileSearch, desc: 'Evidence ledger and source registry' },
      { label: 'Lessons Learned', to: '/lessons', icon: Lightbulb, desc: 'What worked, what failed, design rules' },
      { label: 'Knowledge Graph', to: '/graph', icon: Network, desc: 'Explore relationships across the thread' },
      { label: 'Engineering Memory', to: '/memory', icon: Compass, desc: 'Have we solved this before?' },
      { label: 'What Can We Reuse?', to: '/reuse', icon: GitCompare, desc: 'What can we reuse?' },
      { label: 'What Is Missing?', to: '/missing', icon: ListChecks, desc: 'Gaps in the digital thread' },
      { label: 'What Changed?', to: '/changed', icon: Activity, desc: 'Dataset versions and local changes' },
      { label: 'AI Context', to: '/ai', icon: Sparkles, desc: 'Context + prompt library for your AI assistant (no API)' },
    ],
  },
  {
    id: 'quality',
    label: 'Quality & Release',
    icon: ShieldCheck,
    pages: [
      { label: 'Risk & FMEA', to: '/quality', icon: ShieldCheck, desc: 'Risk register and FMEA (RPN)' },
      { label: 'Design Gates', to: '/gates', icon: ClipboardCheck, desc: 'G0–G10 reviews and rules', keywords: 'g0 g10 gate review' },
      { label: 'Decisions', to: '/decisions', icon: GitBranch, desc: 'Engineering decisions and rationale' },
      { label: 'Change Requests', to: '/changes', icon: Hammer, desc: 'ECR / ECN change management', keywords: 'ecr ecn' },
      { label: 'FAT / SAT', to: '/fat-sat', icon: ListChecks, desc: 'Acceptance protocols from requirements' },
      { label: 'Production Release', to: '/production-release', icon: Factory, desc: 'G10 release checklist' },
      { label: 'Field Service', to: '/service', icon: Wrench, desc: 'Installed base, tickets, MTBF/MTTR' },
    ],
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: Compass,
    pages: [
      { label: 'Global Intelligence', to: '/global', icon: Globe2, desc: 'Companies, products and evidence from reviewed sources' },
      { label: 'Technology Radar', to: '/technology', icon: Radar, desc: 'Technologies tracked from the handbooks' },
      { label: 'Localization', to: '/localization', icon: MapIcon, desc: 'Imported components → Indian alternatives' },
      { label: 'Roadmap', to: '/roadmap', icon: Route, desc: 'Product roadmap' },
      { label: 'Companies', to: '/companies', icon: Building2, desc: 'All organisations known to the system' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: SlidersHorizontal,
    pages: [
      { label: 'Data & Workspace', to: '/admin', icon: Settings2, desc: 'Drafts, change packages, backup, import, lock' },
      { label: 'Data Quality', to: '/data-quality', icon: Activity, desc: 'Health of master data and drafts' },
      { label: 'Reports', to: '/reports', icon: BarChart3, desc: 'Printable summaries and exports' },
      { label: 'Help', to: '/help', icon: Lightbulb, desc: 'Concepts, workflows, shortcuts, glossary' },
      { label: 'Legacy Applications', to: '/legacy', icon: Layers, desc: 'The original simulator, cost platform and PM tracker' },
    ],
  },
];

export const ALL_PAGES: (NavPage & { section: NavSection })[] = SECTIONS.flatMap((s) => s.pages.map((p) => ({ ...p, section: s })));

/** Best page match for a pathname (longest prefix). */
export function pageFor(pathname: string): (NavPage & { section: NavSection }) | undefined {
  if (pathname === '/') return ALL_PAGES[0];
  return ALL_PAGES.filter((p) => p.to !== '/' && (pathname === p.to || pathname.startsWith(`${p.to}/`))).sort((a, b) => b.to.length - a.to.length)[0];
}

/** Section a route belongs to, for records: entity route → section. */
export const sectionForRoute = (route?: string) => (route ? pageFor(route) : undefined);

/* ------------------------------------------------------------------ workspaces */

export interface WorkspaceDef {
  id: WorkspaceId;
  label: string;
  desc: string;
  icon: LucideIcon;
  /** sections in display order; unlisted sections follow, collapsed */
  focus: string[];
}

export const WORKSPACES: WorkspaceDef[] = [
  { id: 'engineering', label: 'Engineering', desc: 'Everything, engineering first', icon: Cog, focus: ['home', 'work', 'engineering', 'laser', 'supply', 'quality', 'knowledge', 'semiconductor', 'strategy', 'admin'] },
  { id: 'product', label: 'Product Management', desc: 'Customers, opportunities, requirements, POCs, projects', icon: Target, focus: ['home', 'work', 'engineering', 'supply', 'strategy'] },
  { id: 'laser', label: 'Laser', desc: 'Sources, optics, process, calculators', icon: Crosshair, focus: ['home', 'laser', 'engineering', 'knowledge'] },
  { id: 'semiconductor', label: 'Semiconductor', desc: 'Value chain, equipment, localization', icon: Cpu, focus: ['home', 'semiconductor', 'strategy', 'supply', 'knowledge'] },
  { id: 'supply', label: 'Supply Chain', desc: 'Suppliers, BOMs, RFQs, cost', icon: Truck, focus: ['home', 'supply', 'strategy', 'work'] },
  { id: 'intelligence', label: 'Intelligence', desc: 'Global intelligence, knowledge, evidence', icon: Globe2, focus: ['home', 'strategy', 'knowledge', 'supply'] },
  { id: 'executive', label: 'Executive', desc: 'Pipeline, projects, portfolio, risk, cost, roadmap', icon: BarChart3, focus: ['home', 'work', 'strategy'] },
];
export const workspaceDef = (id: WorkspaceId) => WORKSPACES.find((w) => w.id === id) ?? WORKSPACES[0];

export function orderedSections(ws: WorkspaceId): { section: NavSection; primary: boolean }[] {
  const def = workspaceDef(ws);
  const primary = def.focus.map((id) => SECTIONS.find((s) => s.id === id)!).filter(Boolean);
  const rest = SECTIONS.filter((s) => !def.focus.includes(s.id));
  return [...primary.map((section) => ({ section, primary: true })), ...rest.map((section) => ({ section, primary: false }))];
}
