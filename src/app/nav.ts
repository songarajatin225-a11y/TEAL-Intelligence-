import {
  Activity,
  ArrowDownUp,
  BarChart3,
  BatteryCharging,
  Beaker,
  BookOpen,
  Bot,
  Boxes,
  Briefcase,
  Building2,
  Calculator,
  CircuitBoard,
  ClipboardCheck,
  ClipboardList,
  Cog,
  Columns2,
  Compass,
  CopyCheck,
  Cpu,
  Crosshair,
  DollarSign,
  DoorOpen,
  Factory,
  FileSearch,
  FileText,
  FlaskConical,
  Gauge,
  GitBranch,
  GitCompare,
  Globe2,
  Grid3x3,
  Hammer,
  Handshake,
  HeartPulse,
  Home,
  Landmark,
  Layers,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Map as MapIcon,
  MessageSquareText,
  Microscope,
  Milestone,
  Network,
  Package,
  PackageSearch,
  Radar,
  Route,
  Ruler,
  ScanLine,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Truck,
  UserPlus,
  Users,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { WorkspaceId } from './prefs';

/*
 * INFORMATION ARCHITECTURE (final master prompt §33; docs/08): Command Center · Intelligence · Domains ·
 * Product · Ecosystem · Execution · Roadmap · Data · Settings.
 * Every pre-redesign route is still reachable; the sidebar shows domains, not 56 flat links.
 */
export interface NavPage {
  label: string;
  to: string;
  icon: LucideIcon;
  /** optional sub-group heading inside a section (e.g. Intelligence → Technology / Market) */
  group?: string;
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
    label: 'Command Center',
    icon: Home,
    pages: [
      { label: 'Mission Control', to: '/', icon: LayoutDashboard, desc: 'What needs attention, the business flow and what is changing', keywords: 'home command center executive' },
      { label: 'Business Value', to: '/value', icon: Gauge, desc: 'Records held, reuse, domain coverage, development visibility', keywords: 'value metrics reuse coverage' },
      { label: 'Dashboards', to: '/dashboards', icon: BarChart3, desc: 'Management, engineering, procurement, quality and service analytics', keywords: 'analytics charts' },
      { label: 'Rooms', to: '/rooms', icon: DoorOpen, desc: 'One place per program, product, POC, supplier, opportunity, customer', keywords: 'room program workspace war room' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: Compass,
    pages: [
      { group: 'Technology', label: 'Technology Radar', to: '/technology', icon: Radar, desc: 'Rings, TRL maturity and evidence-gated market maturity', keywords: 'trl maturity radar adopt evaluate' },
      { group: 'Technology', label: 'Cross-Domain Map', to: '/cross-domain', icon: Network, desc: 'Which technologies serve which domains, with evidence', keywords: 'cross domain uv laser vision robotics' },
      { group: 'Technology', label: 'Compare', to: '/compare', icon: Columns2, desc: 'Technologies, products, suppliers, configurations side by side', keywords: 'compare versus diff side by side' },
      { group: 'Market', label: 'Market & Business Case', to: '/business-case', icon: Landmark, desc: 'Competitors, sourced TAM/SAM/SOM, NPV and payback with sensitivity', keywords: 'business case npv payback market tam sam som competitor' },
      { group: 'Market', label: 'Opportunity Matrix', to: '/opportunity-matrix', icon: Grid3x3, desc: 'Every opportunity against the same strategic questions', keywords: 'opportunity matrix strategic relevance market size' },
      { group: 'Market', label: 'Global Intelligence', to: '/global', icon: Globe2, desc: 'Companies, products and evidence from reviewed sources' },
      { group: 'Market', label: 'Companies', to: '/companies', icon: Building2, desc: 'All organisations known to the system' },
      { group: 'Applications', label: 'Application Engine', to: '/solution', icon: Workflow, desc: 'Industry → part → material → process → technology → machine → subsystem', keywords: 'application intelligence engine universal configurator solution' },
      { group: 'Applications', label: 'Use Cases', to: '/use-cases', icon: Route, desc: 'Five cross-domain walkthroughs: PCB marking, package marking, tab welding, depaneling, dicing', keywords: 'use case walkthrough demo scenario' },
      { group: 'Applications', label: 'Applications', to: '/applications', icon: Microscope, desc: 'Applications by industry and process' },
      { group: 'Applications', label: 'Materials', to: '/materials', icon: Beaker, desc: 'Material properties and absorption' },
      { group: 'Knowledge', label: 'Ask Intelligence', to: '/ask', icon: MessageSquareText, desc: 'Ask a question; answered from records and handbooks (no AI model)', keywords: 'ask question copilot answer' },
      { group: 'Knowledge', label: 'Engineering Knowledge', to: '/knowledge', icon: BookOpen, desc: 'Laser, automation and semiconductor handbooks', keywords: 'handbook library' },
      { group: 'Knowledge', label: 'Knowledge Articles', to: '/articles', icon: FileText, desc: 'Engineering articles written by TEAL', keywords: 'article knowledge base' },
      { group: 'Knowledge', label: 'Search', to: '/search', icon: Search, desc: 'Search everything, including technical parameters' },
      { group: 'Knowledge', label: 'Evidence', to: '/evidence', icon: FileSearch, desc: 'Evidence ledger and source registry' },
      { group: 'Knowledge', label: 'Lessons Learned', to: '/lessons', icon: Lightbulb, desc: 'What worked, what failed, design rules' },
      { group: 'Knowledge', label: 'Knowledge Graph', to: '/graph', icon: Network, desc: 'Explore relationships across the thread' },
      { group: 'Knowledge', label: 'Engineering Memory', to: '/memory', icon: Compass, desc: 'Have we solved this before?' },
      { group: 'Knowledge', label: 'What Can We Reuse?', to: '/reuse', icon: GitCompare, desc: 'What can we reuse?' },
      { group: 'Knowledge', label: 'What Is Missing?', to: '/missing', icon: ListChecks, desc: 'Gaps in the digital thread' },
      { group: 'Knowledge', label: 'What Changed?', to: '/changed', icon: Activity, desc: 'Dataset versions and local changes' },
      { group: 'Knowledge', label: 'AI Context', to: '/ai', icon: Sparkles, desc: 'Context + prompt library for your AI assistant (no API)' },
    ],
  },
  {
    id: 'domains',
    label: 'Domains',
    icon: Crosshair,
    pages: [
      { label: 'All Domains', to: '/domains', icon: Network, desc: 'Laser, Electronics, Semiconductor, Battery, Automation, Advanced Manufacturing', keywords: 'domain architecture industries' },
      { group: 'Laser & Photonics', label: 'Laser & Photonics', to: '/domains/laser', icon: Crosshair, desc: 'Laser technologies, applications and subsystems', keywords: 'laser photonics domain' },
      { group: 'Laser & Photonics', label: 'Laser Platform', to: '/laser', icon: Crosshair, desc: 'Beam path, sources, optics and process at a glance' },
      { group: 'Laser & Photonics', label: 'Laser Sources', to: '/laser-sources', icon: Radar, desc: 'Source technologies and parameters', keywords: 'fiber mopa uv co2 green ultrafast 1064nm' },
      { group: 'Laser & Photonics', label: 'Optics', to: '/optics', icon: ScanLine, desc: 'F-theta objectives and beam delivery optics', keywords: 'beam delivery lens' },
      { group: 'Laser & Photonics', label: 'Galvo Scanners', to: '/galvo', icon: Crosshair, desc: 'Scan heads and galvanometer scanners' },
      { group: 'Laser & Photonics', label: 'Process Engineering', to: '/process', icon: Beaker, desc: 'Process regime, parameters and window' },
      { group: 'Laser & Photonics', label: 'DOE Studies', to: '/doe', icon: GitBranch, desc: 'Design of experiments and process windows', keywords: 'design of experiments' },
      { group: 'Laser & Photonics', label: 'Calculators', to: '/calculators', icon: Calculator, desc: 'Laser, automation, cost, project and quality formulas' },
      { group: 'Laser & Photonics', label: 'Formulas', to: '/formulas', icon: BookOpen, desc: 'Handbook formula catalogue (177)' },
      { group: 'Laser & Photonics', label: 'Unit Converter', to: '/units', icon: Ruler, desc: 'Convert engineering units', keywords: 'units convert nm um kw' },
      { group: 'Electronics & EMS', label: 'Electronics & EMS', to: '/domains/electronics', icon: CircuitBoard, desc: 'SMT, PCB inspection and test, depaneling, EMS equipment', keywords: 'pcb ems smt electronics' },
      { group: 'Semiconductor', label: 'Semiconductor Domain', to: '/domains/semiconductor', icon: Cpu, desc: 'Front-end, back-end/ATMP and laser applications', keywords: 'semiconductor domain wafer dicing' },
      { group: 'Semiconductor', label: 'Semiconductor Intelligence', to: '/semiconductor', icon: CircuitBoard, desc: 'Value chain, process steps and laser relevance', keywords: 'atmp packaging wafer' },
      { group: 'Semiconductor', label: 'Equipment Buyer', to: '/equipment-buyer', icon: Cpu, desc: 'Buyer criteria and cost of ownership' },
      { group: 'Battery & New Energy', label: 'Battery & New Energy', to: '/domains/battery', icon: BatteryCharging, desc: 'Chemistries, form factors, cell process and laser applications', keywords: 'battery cell tab welding ev' },
      { group: 'Automation', label: 'Industrial Automation', to: '/domains/automation', icon: Bot, desc: 'Generic automation-equipment architecture', keywords: 'automation robot plc servo' },
      { group: 'Automation', label: 'Modules', to: '/modules', icon: Boxes, desc: 'Reusable automation, vision and software modules' },
      { group: 'Automation', label: 'Architecture Canvas', to: '/architecture', icon: Network, desc: 'Machine architecture builder' },
      { group: 'Automation', label: 'Machines', to: '/machines', icon: Factory, desc: 'Saved configurations and serialized machines' },
      { group: 'Other', label: 'Advanced Manufacturing', to: '/domains/advanced-manufacturing', icon: Factory, desc: 'Reserved domain — taxonomy to be defined' },
      { group: 'Other', label: 'Equipment', to: '/equipment', icon: Factory, desc: 'Market equipment database by domain', keywords: 'equipment capex wafer size throughput' },
    ],
  },
  {
    id: 'product',
    label: 'Product',
    icon: Package,
    pages: [
      { label: 'Products', to: '/products', icon: Package, desc: 'TEAL platforms, product DNA and portfolio' },
      { label: 'Product Development', to: '/development', icon: Milestone, desc: 'Seventeen lifecycle stages, placed by evidence', keywords: 'lifecycle pipeline trl stage gate' },
      { label: 'Product from Inquiry', to: '/inquiry', icon: Sparkles, desc: 'Turn a customer inquiry into a draft product package', keywords: 'create product inquiry flagship' },
      { label: 'Requirement Capture', to: '/capture', icon: ClipboardList, desc: 'Structured customer requirements → URS', keywords: 'customer requirement engine capture throughput accuracy' },
      { label: 'Requirements', to: '/requirements', icon: ClipboardCheck, desc: 'URS → SRS → design → test' },
      { label: 'Traceability', to: '/traceability', icon: Route, desc: 'Requirement → module → BOM → FAT → SAT' },
      { label: 'Configurator', to: '/configurator', icon: Layers, desc: 'Configure a machine: source, optics, modules, price, physics' },
      { label: 'Platformization', to: '/platformization', icon: GitCompare, desc: 'Custom machine → standard platform' },
      { label: 'Product Architecture', to: '/product-architecture', icon: Network, desc: 'Product → system → subsystem → module → component', keywords: 'architecture tree drill down system subsystem' },
      { label: 'BOMs', to: '/bom', icon: Layers, desc: 'Bills of material by product and configuration' },
      { label: 'Components', to: '/items', icon: Package, desc: 'Component / item master with stock codes', keywords: 'item master' },
      { label: 'Cost', to: '/cost', icon: DollarSign, desc: 'Cost models, TEAL cost sheet, scenarios, margins' },
      { label: 'Localization', to: '/localization', icon: MapIcon, desc: 'Imported components → Indian alternatives' },
      { label: 'Documents', to: '/documents', icon: FileText, desc: 'PRD, RFQ, spec, BOM, POC plan, DFM, validation, MOM, reviews', keywords: 'document template prd rfq specification mom' },
    ],
  },
  {
    id: 'ecosystem',
    label: 'Ecosystem',
    icon: Handshake,
    pages: [
      { label: 'Suppliers', to: '/suppliers', icon: Truck, desc: 'Supplier records and capabilities' },
      { label: 'Supplier Risk', to: '/supplier-risk', icon: ShieldAlert, desc: 'Recorded risk × dependency matrix', keywords: 'supplier risk matrix single source long lead' },
      { label: 'Procurement', to: '/procurement', icon: PackageSearch, desc: 'Bought-out lines, lead times and risk' },
      { label: 'RFQs', to: '/rfq', icon: FileSearch, desc: 'Requests for quotation and quote comparison' },
      { label: 'Partners', to: '/partners', icon: Handshake, desc: 'Technology partners, integrators, research institutions', keywords: 'partner research institution oem integrator' },
      { label: 'Customers', to: '/customers', icon: Users, desc: 'Customers, contacts and sites' },
      { label: 'LeadConnect', to: '/leads', icon: UserPlus, desc: 'Capture exhibition and event leads with follow-ups', keywords: 'lead exhibition event trade show capture' },
    ],
  },
  {
    id: 'execution',
    label: 'Execution',
    icon: Briefcase,
    pages: [
      { label: 'My Workspace', to: '/pm', icon: Target, desc: 'Today, follow-ups, meetings and next actions', keywords: 'product manager pm today' },
      { label: 'Tasks & Milestones', to: '/execution', icon: ListChecks, desc: 'Kanban, table, timeline, calendar, milestones, risk matrix', keywords: 'tasks milestones kanban calendar timeline risk matrix' },
      { label: 'Projects', to: '/projects', icon: Briefcase, desc: 'Delivery projects, schedules and gates' },
      { label: 'POCs', to: '/poc', icon: FlaskConical, desc: 'Proofs of concept on real customer samples', keywords: 'proof of concept samples trial' },
      { label: 'Opportunities', to: '/opportunities', icon: Zap, desc: 'Customer pipeline from lead to won', keywords: 'pipeline deals' },
      { label: 'Activities', to: '/activities', icon: ListChecks, desc: 'Tasks, meetings, follow-ups and daily logs' },
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
    id: 'roadmap',
    label: 'Roadmap',
    icon: Route,
    pages: [{ label: 'Roadmap', to: '/roadmap', icon: Route, desc: 'Technology and product roadmap 2026 → 2030+', keywords: 'roadmap 2026 2027 2028 2029 2030' }],
  },
  {
    id: 'data',
    label: 'Data',
    icon: SlidersHorizontal,
    pages: [
      { label: 'Data Manager', to: '/admin', icon: Settings2, desc: 'Drafts, change packages, backup, import, lock', keywords: 'data workspace admin' },
      { label: 'Data Health', to: '/data-quality', icon: HeartPulse, desc: 'Records, valid, warnings, errors, duplicates, missing sources', keywords: 'data quality validation' },
      { label: 'Import / Export', to: '/import-export', icon: ArrowDownUp, desc: 'CSV / JSON export, change packages, backup, legacy import' },
      { label: 'Duplicates', to: '/duplicates', icon: CopyCheck, desc: 'Likely duplicate records — review, never auto-merged', keywords: 'dedupe duplicate merge' },
      { label: 'Reports', to: '/reports', icon: BarChart3, desc: 'Printable summaries and exports' },
      { label: 'Legacy Applications', to: '/legacy', icon: Layers, desc: 'The original simulator, cost platform and PM tracker' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Cog,
    pages: [
      { label: 'Settings', to: '/settings', icon: Cog, desc: 'Appearance, workspace, providers, security limits' },
      { label: 'Help', to: '/help', icon: Lightbulb, desc: 'Concepts, workflows, shortcuts, glossary' },
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
  { id: 'engineering', label: 'Engineering', desc: 'Everything, product and engineering first', icon: Cog, focus: ['home', 'product', 'domains', 'execution', 'intelligence', 'ecosystem', 'roadmap', 'data', 'settings'] },
  { id: 'product', label: 'Product Management', desc: 'Portfolio, requirements, roadmap, POCs, projects, suppliers, cost', icon: Target, focus: ['home', 'product', 'execution', 'roadmap', 'ecosystem', 'intelligence'] },
  { id: 'laser', label: 'Laser', desc: 'Sources, optics, process, calculators', icon: Crosshair, focus: ['home', 'domains', 'product', 'intelligence'] },
  { id: 'semiconductor', label: 'Semiconductor', desc: 'Value chain, equipment, localization', icon: Cpu, focus: ['home', 'domains', 'intelligence', 'ecosystem', 'product'] },
  { id: 'supply', label: 'Supply Chain', desc: 'Suppliers, BOMs, RFQs, cost, localization', icon: Truck, focus: ['home', 'ecosystem', 'product', 'execution'] },
  { id: 'intelligence', label: 'Intelligence', desc: 'Technology, market, applications, knowledge', icon: Globe2, focus: ['home', 'intelligence', 'domains', 'ecosystem'] },
  { id: 'executive', label: 'Executive', desc: 'Strategic opportunities, pipeline, investments, risks, decisions', icon: BarChart3, focus: ['home', 'roadmap', 'execution', 'intelligence'] },
];
export const workspaceDef = (id: WorkspaceId) => WORKSPACES.find((w) => w.id === id) ?? WORKSPACES[0];

export function orderedSections(ws: WorkspaceId): { section: NavSection; primary: boolean }[] {
  const def = workspaceDef(ws);
  const primary = def.focus.map((id) => SECTIONS.find((s) => s.id === id)!).filter(Boolean);
  const rest = SECTIONS.filter((s) => !def.focus.includes(s.id));
  return [...primary.map((section) => ({ section, primary: true })), ...rest.map((section) => ({ section, primary: false }))];
}
