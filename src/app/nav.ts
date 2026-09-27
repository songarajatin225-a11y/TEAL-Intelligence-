import {
  Activity,
  ArrowDownUp,
  BarChart3,
  BatteryCharging,
  AlertTriangle,
  Beaker,
  BookOpen,
  Box,
  Camera,
  Car,
  Code2,
  Database,
  Dices,
  Move,
  Plane,
  Plug,
  Wind,
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
 * INFORMATION ARCHITECTURE (industrial intelligence master prompt §4; docs/09): Home · Intelligence ·
 * Industries · Applications · Requirements · Products · Equipment Simulation · Engineering · BOM & Cost ·
 * Suppliers · Projects · Quality · Service · Knowledge · Documents · Risks · Business Case · Admin.
 * Every entry opens a working page (or a page filtered by a URL parameter) — no placeholder links.
 * Every pre-existing route stays reachable.
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
    label: 'Home',
    icon: Home,
    pages: [
      { label: 'Executive Command Center', to: '/', icon: LayoutDashboard, desc: 'Products, POCs, projects, requirements, simulations, readiness, risks, pipeline', keywords: 'home mission control command center executive' },
      { label: 'Action Center', to: '/actions', icon: ListChecks, desc: 'Assigned requirements, approvals, changes, failed tests, supplier and customer actions, overdue milestones', keywords: 'actions approvals overdue failed tests todo' },
      { label: 'My Workspace', to: '/pm', icon: Target, desc: 'Today, follow-ups, meetings and next actions', keywords: 'product manager pm today' },
      { label: 'Dashboards', to: '/dashboards', icon: BarChart3, desc: 'Management, engineering, procurement, quality and service analytics', keywords: 'analytics charts' },
      { label: 'Rooms', to: '/rooms', icon: DoorOpen, desc: 'One place per program, product, POC, supplier, opportunity, customer', keywords: 'room program workspace war room' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: Compass,
    pages: [
      { label: 'Global Engineering Database', to: '/engineering-db', icon: Database, desc: 'Manufacturers, products, specifications with evidence, technical search, compatibility', keywords: 'engineering database products components specifications parametric search manufacturers 1064 nm galvo camera' },
      { label: 'Market Intelligence', to: '/business-case', icon: Landmark, desc: 'Competitors, sourced TAM/SAM/SOM, NPV and payback with sensitivity', keywords: 'market business case npv competitor tam' },
      { label: 'Industry Intelligence', to: '/domains', icon: Network, desc: 'Laser, Electronics, Semiconductor, Battery, Automation, Advanced Manufacturing', keywords: 'domain industries' },
      { label: 'Technology Intelligence', to: '/technology', icon: Radar, desc: 'Rings, TRL maturity and evidence-gated market maturity', keywords: 'trl maturity radar adopt evaluate' },
      { label: 'Customer Intelligence', to: '/customers', icon: Users, desc: 'Customers, applications, requirements, POCs, projects', keywords: 'customer accounts' },
      { label: 'Competitor Intelligence', to: '/companies', icon: Building2, desc: 'All organisations — competitors, suppliers, manufacturers, partners', keywords: 'competitor companies organisations' },
      { label: 'Supplier Intelligence', to: '/suppliers', icon: Truck, desc: 'Supplier records, capabilities, lead times', keywords: 'supplier vendor' },
      { label: 'Global Intelligence', to: '/global', icon: Globe2, desc: 'Companies, products and evidence from reviewed sources' },
      { label: 'Cross-Domain Map', to: '/cross-domain', icon: Network, desc: 'Which technologies serve which domains, with evidence', keywords: 'cross domain uv laser vision robotics' },
      { label: 'Compare', to: '/compare', icon: Columns2, desc: 'Records of one type side by side', keywords: 'compare versus diff side by side' },
    ],
  },
  {
    id: 'industries',
    label: 'Industries',
    icon: Factory,
    pages: [
      { label: 'Electronics / EMS', to: '/domains/electronics', icon: CircuitBoard, desc: 'SMT, PCB inspection and test, depaneling, EMS equipment', keywords: 'pcb ems smt electronics' },
      { label: 'Semiconductor', to: '/domains/semiconductor', icon: Cpu, desc: 'Front-end, back-end/ATMP and laser applications', keywords: 'semiconductor wafer dicing atmp' },
      { label: 'Battery & New Energy', to: '/domains/battery', icon: BatteryCharging, desc: 'Chemistries, cell process, EV and new-energy laser applications', keywords: 'battery ev solar new energy cell tab welding' },
      { label: 'Automotive', to: '/record/ind-auto', icon: Car, desc: 'Automotive industry record and its applications', keywords: 'automotive' },
      { label: 'Aerospace', to: '/record/ind-aero', icon: Plane, desc: 'Aerospace & defence industry record and its applications', keywords: 'aerospace defence' },
      { label: 'General Industrial', to: '/record/ind-genengg', icon: Wrench, desc: 'General engineering industry record and its applications', keywords: 'general industrial engineering' },
      { label: 'Laser & Photonics', to: '/domains/laser', icon: Crosshair, desc: 'Laser technologies, applications and subsystems', keywords: 'laser photonics domain' },
      { label: 'Industrial Automation', to: '/domains/automation', icon: Bot, desc: 'Generic automation-equipment architecture', keywords: 'automation robot plc servo' },
      { label: 'Advanced Manufacturing', to: '/domains/advanced-manufacturing', icon: Factory, desc: 'Reserved domain — taxonomy to be defined' },
      { group: 'Semiconductor detail', label: 'Semiconductor Value Chain', to: '/semiconductor', icon: CircuitBoard, desc: 'Value chain, process steps and laser relevance', keywords: 'atmp packaging wafer' },
      { group: 'Semiconductor detail', label: 'Equipment Buyer', to: '/equipment-buyer', icon: Cpu, desc: 'Buyer criteria and cost of ownership' },
      { group: 'Semiconductor detail', label: 'Market Equipment', to: '/equipment', icon: Factory, desc: 'Market equipment database by domain', keywords: 'equipment capex wafer size throughput' },
    ],
  },
  {
    id: 'applications',
    label: 'Applications',
    icon: Microscope,
    pages: [
      { label: 'Application Engine', to: '/solution', icon: Workflow, desc: 'Industry → part → material → process → technology → machine → subsystem', keywords: 'application intelligence engine universal configurator solution' },
      { label: 'All Applications', to: '/applications', icon: Microscope, desc: 'Applications by industry and process' },
      { label: 'Use Cases', to: '/use-cases', icon: Route, desc: 'Cross-domain walkthroughs', keywords: 'use case walkthrough demo scenario' },
      { group: 'Laser processes', label: 'Laser Marking', to: '/applications?process=Marking', icon: ScanLine, desc: 'Marking applications', keywords: 'marking engraving etching' },
      { group: 'Laser processes', label: 'Laser Welding', to: '/applications?process=Welding', icon: Zap, desc: 'Welding applications', keywords: 'welding' },
      { group: 'Laser processes', label: 'Laser Cutting', to: '/applications?process=Cutting', icon: Crosshair, desc: 'Cutting applications', keywords: 'cutting' },
      { group: 'Laser processes', label: 'Laser Cleaning', to: '/applications?process=Cleaning', icon: Sparkles, desc: 'Cleaning applications', keywords: 'cleaning' },
      { group: 'Laser processes', label: 'Laser Drilling', to: '/applications?process=Drilling', icon: Crosshair, desc: 'Drilling applications', keywords: 'drilling' },
      { group: 'Laser processes', label: 'Laser Dicing & Scribing', to: '/applications?process=Dicing', icon: Grid3x3, desc: 'Dicing / scribing applications', keywords: 'dicing scribing' },
      { group: 'Laser processes', label: 'Micromachining', to: '/applications?process=Micromachining', icon: Microscope, desc: 'Micromachining applications', keywords: 'micromachining etching ablation' },
      { group: 'Automation processes', label: 'Vision Inspection', to: '/applications?process=Inspection', icon: ScanLine, desc: 'Inspection applications', keywords: 'vision inspection aoi' },
      { group: 'Automation processes', label: 'Assembly', to: '/applications?process=Assembly', icon: Boxes, desc: 'Assembly applications', keywords: 'assembly' },
      { group: 'Automation processes', label: 'Material Handling', to: '/applications?process=Handling', icon: Bot, desc: 'Handling and robotics applications', keywords: 'handling robotics pick place' },
      { group: 'Process knowledge', label: 'Process Engineering', to: '/process', icon: Beaker, desc: 'Process regime, parameters and window' },
      { group: 'Process knowledge', label: 'Process Recipes', to: '/recipes', icon: ClipboardList, desc: 'Recipes: parameters, quality and acceptance criteria', keywords: 'recipe parameters process window' },
      { group: 'Process knowledge', label: 'DOE Studies', to: '/doe', icon: GitBranch, desc: 'Design of experiments and process windows', keywords: 'design of experiments' },
      { group: 'Process knowledge', label: 'Materials', to: '/materials', icon: Beaker, desc: 'Material properties and absorption' },
    ],
  },
  {
    id: 'requirements',
    label: 'Requirements',
    icon: ClipboardCheck,
    pages: [
      { label: 'Requirement Database', to: '/requirements', icon: ClipboardCheck, desc: 'Market, customer, product, system, subsystem and component requirements' },
      { label: 'Requirement Capture', to: '/capture', icon: ClipboardList, desc: 'Structured customer requirements → URS', keywords: 'customer requirement engine capture throughput accuracy' },
      { label: 'Quality & Coverage', to: '/requirements-quality', icon: ListChecks, desc: 'Vague wording, missing units / acceptance / owner, trace coverage', keywords: 'requirement quality vague ambiguous coverage' },
      { label: 'Traceability', to: '/traceability', icon: Route, desc: 'Requirement → module → BOM → FAT → SAT' },
      { label: 'Verification & Validation', to: '/verification', icon: CopyCheck, desc: 'Inspection, analysis, demonstration, test; customer validation', keywords: 'verification validation test result' },
      { label: 'Baselines', to: '/requirements-quality?tab=baselines', icon: GitBranch, desc: 'Requirements grouped by baseline', keywords: 'baseline' },
      { label: 'Change Management', to: '/changes', icon: Hammer, desc: 'ECR / ECN / ECO with old → new value and approval', keywords: 'ecr ecn eco change' },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    pages: [
      { label: 'Product Portfolio', to: '/products', icon: Package, desc: 'TEAL platforms, product DNA and portfolio' },
      { label: 'Product Development', to: '/development', icon: Milestone, desc: 'Seventeen lifecycle stages, placed by evidence', keywords: 'lifecycle pipeline trl stage gate' },
      { label: 'Product Variants', to: '/machines', icon: Layers, desc: 'Saved configurations and serialized machines', keywords: 'variants configurations' },
      { label: 'Product Roadmap', to: '/roadmap', icon: Route, desc: 'Technology and product roadmap 2026 → 2030+', keywords: 'roadmap 2026 2027 2028 2029 2030' },
      { label: 'Product Readiness', to: '/gates', icon: ClipboardCheck, desc: 'G0–G10 reviews and rules', keywords: 'g0 g10 gate review readiness' },
      { label: 'Product from Inquiry', to: '/inquiry', icon: Sparkles, desc: 'Turn a customer inquiry into a draft product package', keywords: 'create product inquiry flagship' },
      { label: 'Configurator', to: '/configurator', icon: Layers, desc: 'Configure a machine: source, optics, modules, price, physics' },
      { label: 'Product Architecture', to: '/product-architecture', icon: Network, desc: 'Product → system → subsystem → module → component', keywords: 'architecture tree drill down system subsystem' },
      { label: 'Platformization', to: '/platformization', icon: GitCompare, desc: 'Custom machine → standard platform' },
    ],
  },
  {
    id: 'simulation',
    label: 'Equipment Simulation',
    icon: FlaskConical,
    pages: [
      { label: 'Simulation Studio', to: '/studio', icon: FlaskConical, desc: 'Flagship: architecture, components, cycle time, capacity, bottleneck, Monte Carlo, twin, cost, review', keywords: 'simulation studio equipment digital twin des monte carlo uph cycle time' },
      { label: 'Equipment Library', to: '/studio?tab=library', icon: Boxes, desc: 'Equipment templates: laser, electronics, semiconductor, battery, automation', keywords: 'templates library' },
      { label: 'Architecture Builder', to: '/studio?focus=architecture', icon: Network, desc: 'Stations, flow, buffers and parallel servers of a scenario' },
      { label: 'Digital Twin', to: '/studio?focus=twin', icon: Box, desc: '2D twin with clickable objects and machine states', keywords: 'digital twin' },
      { label: 'Capacity & Bottleneck', to: '/studio?focus=capacity', icon: Gauge, desc: 'Cycle time, UPH, OEE, capacity, lineage', keywords: 'capacity bottleneck cycle time uph oee' },
      { label: 'Material Flow (DES)', to: '/studio?focus=simulate', icon: Activity, desc: 'Discrete-event simulation with animated replay', keywords: 'discrete event material flow' },
      { label: 'Monte Carlo', to: '/studio?focus=variability', icon: Dices, desc: 'P50 / P90 / P95 / P99 throughput and probability of meeting target', keywords: 'monte carlo variability' },
      { label: 'What-If', to: '/studio?focus=whatif', icon: SlidersHorizontal, desc: 'Change speed, stations, buffers, suppliers — recalculate', keywords: 'what if sensitivity' },
      { label: 'Optimization', to: '/studio?focus=optimize', icon: Target, desc: 'Constraints → feasible configurations → Pareto frontier', keywords: 'optimization pareto' },
      { label: 'Scenario Comparison', to: '/studio?tab=compare', icon: Columns2, desc: 'Scenarios side by side — no winner declared', keywords: 'scenario compare' },
      { label: 'Architecture Canvas', to: '/architecture', icon: Network, desc: 'Machine architecture builder (configurator-based)' },
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    icon: Cog,
    pages: [
      { group: 'Disciplines', label: 'Mechanical', to: '/engineering-db?discipline=Mechanical', icon: Cog, desc: 'Frames, fixtures, conveyors, enclosures', keywords: 'mechanical' },
      { group: 'Disciplines', label: 'Electrical', to: '/engineering-db?discipline=Electrical', icon: Zap, desc: 'Power supplies, breakers, contactors, cables', keywords: 'electrical' },
      { group: 'Disciplines', label: 'Controls', to: '/engineering-db?discipline=Controls', icon: Cpu, desc: 'PLC, HMI, industrial PC, sensors', keywords: 'controls plc hmi' },
      { group: 'Disciplines', label: 'Motion', to: '/engineering-db?discipline=Motion', icon: Move, desc: 'Servo motors and drives, stages, encoders', keywords: 'motion servo stage' },
      { group: 'Disciplines', label: 'Laser', to: '/engineering-db?discipline=Laser', icon: Crosshair, desc: 'Laser sources, heads, chillers, extraction', keywords: 'laser source' },
      { group: 'Disciplines', label: 'Optics', to: '/engineering-db?discipline=Optics', icon: ScanLine, desc: 'Galvos, f-theta lenses, expanders, optics', keywords: 'optics galvo f-theta' },
      { group: 'Disciplines', label: 'Vision', to: '/engineering-db?discipline=Vision', icon: Camera, desc: 'Cameras, lenses, lighting, controllers', keywords: 'vision camera' },
      { group: 'Disciplines', label: 'Robotics', to: '/engineering-db?discipline=Robotics', icon: Bot, desc: 'Robots, grippers, end effectors', keywords: 'robotics robot' },
      { group: 'Disciplines', label: 'Safety', to: '/engineering-db?discipline=Safety', icon: ShieldCheck, desc: 'Safety PLC, light curtains, interlocks', keywords: 'safety' },
      { group: 'Disciplines', label: 'Pneumatics', to: '/engineering-db?discipline=Pneumatics', icon: Wind, desc: 'Cylinders, valves, vacuum', keywords: 'pneumatics' },
      { group: 'Disciplines', label: 'Software', to: '/engineering-db?discipline=Software', icon: Code2, desc: 'Software components', keywords: 'software' },
      { group: 'Disciplines', label: 'DFM / DFA', to: '/studio?focus=review', icon: Hammer, desc: 'Design review, DFM/DFA flags, build and POC readiness', keywords: 'dfm dfa design review buildability' },
      { group: 'Laser platform', label: 'Laser Platform', to: '/laser', icon: Crosshair, desc: 'Beam path, sources, optics and process at a glance' },
      { group: 'Laser platform', label: 'Laser Sources', to: '/laser-sources', icon: Radar, desc: 'TEAL configurator source technologies', keywords: 'fiber mopa uv co2 green ultrafast 1064nm' },
      { group: 'Laser platform', label: 'Optics', to: '/optics', icon: ScanLine, desc: 'F-theta objectives and beam delivery optics', keywords: 'beam delivery lens' },
      { group: 'Laser platform', label: 'Galvo Scanners', to: '/galvo', icon: Crosshair, desc: 'Scan heads and galvanometer scanners' },
      { group: 'Laser platform', label: 'Modules', to: '/modules', icon: Boxes, desc: 'Reusable automation, vision and software modules' },
      { group: 'Tools', label: 'Calculators', to: '/calculators', icon: Calculator, desc: 'Laser, automation, cost, project and quality formulas' },
      { group: 'Tools', label: 'Formulas', to: '/formulas', icon: BookOpen, desc: 'Handbook formula catalogue (177)' },
      { group: 'Tools', label: 'Unit Converter', to: '/units', icon: Ruler, desc: 'Convert engineering units', keywords: 'units convert nm um kw' },
    ],
  },
  {
    id: 'bom',
    label: 'BOM & Cost',
    icon: DollarSign,
    pages: [
      { label: 'BOM', to: '/bom', icon: Layers, desc: 'Bills of material by product and configuration' },
      { label: 'Product Cost', to: '/cost', icon: DollarSign, desc: 'Cost models, TEAL cost sheet, scenarios, margins' },
      { label: 'Equipment Cost', to: '/studio?focus=cost', icon: Calculator, desc: 'Multi-level equipment BOM and cost from a simulation scenario', keywords: 'equipment cost capex' },
      { label: 'Components', to: '/items', icon: Package, desc: 'Component / item master with stock codes', keywords: 'item master' },
      { label: 'Localization', to: '/localization', icon: MapIcon, desc: 'Imported components → Indian alternatives' },
      { label: 'Procurement', to: '/procurement', icon: PackageSearch, desc: 'Bought-out lines, lead times and risk' },
    ],
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: Truck,
    pages: [
      { label: 'Manufacturer Database', to: '/engineering-db?tab=manufacturers', icon: Building2, desc: 'Manufacturer registry by category', keywords: 'manufacturer registry' },
      { label: 'Supplier Database', to: '/suppliers', icon: Truck, desc: 'Supplier records and capabilities' },
      { label: 'Compatibility', to: '/engineering-db?tab=compatibility', icon: Plug, desc: 'Compatibility rules, relationships and checker', keywords: 'compatibility interface rule' },
      { label: 'Supplier Risk', to: '/supplier-risk', icon: ShieldAlert, desc: 'Recorded risk × dependency matrix', keywords: 'supplier risk matrix single source long lead' },
      { label: 'Supplier Disruption', to: '/studio?tab=disruption', icon: AlertTriangle, desc: 'What if a manufacturer cannot deliver?', keywords: 'disruption outage' },
      { label: 'RFQs', to: '/rfq', icon: FileSearch, desc: 'Requests for quotation and quote comparison' },
      { label: 'Partners', to: '/partners', icon: Handshake, desc: 'Technology partners, integrators, research institutions', keywords: 'partner research institution oem integrator' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: Briefcase,
    pages: [
      { label: 'Projects', to: '/projects', icon: Briefcase, desc: 'Delivery projects, schedules and gates' },
      { label: 'POCs', to: '/poc', icon: FlaskConical, desc: 'Proofs of concept on real customer samples', keywords: 'proof of concept samples trial' },
      { label: 'Milestones', to: '/execution?view=milestones', icon: Milestone, desc: 'Milestones across projects', keywords: 'milestones' },
      { label: 'Tasks & Timeline', to: '/execution', icon: ListChecks, desc: 'Kanban, table, timeline, calendar, risk matrix', keywords: 'tasks kanban calendar timeline' },
      { label: 'FAT / SAT', to: '/fat-sat', icon: ListChecks, desc: 'Acceptance protocols from requirements' },
      { label: 'Production Release', to: '/production-release', icon: Factory, desc: 'G10 release checklist' },
      { label: 'Opportunities', to: '/opportunities', icon: Zap, desc: 'Customer pipeline from lead to won', keywords: 'pipeline deals' },
      { label: 'Activities', to: '/activities', icon: ListChecks, desc: 'Tasks, meetings, follow-ups and daily logs' },
      { label: 'Decisions', to: '/decisions', icon: GitBranch, desc: 'Engineering decisions and rationale' },
      { label: 'LeadConnect', to: '/leads', icon: UserPlus, desc: 'Capture exhibition and event leads with follow-ups', keywords: 'lead exhibition event trade show capture' },
    ],
  },
  {
    id: 'quality',
    label: 'Quality',
    icon: ShieldCheck,
    pages: [
      { label: 'Risk & FMEA', to: '/quality', icon: ShieldCheck, desc: 'Risk register and FMEA (RPN)' },
      { label: 'DFMEA', to: '/dfmea', icon: ShieldCheck, desc: 'Design FMEA', keywords: 'dfmea' },
      { label: 'PFMEA', to: '/pfmea', icon: ShieldCheck, desc: 'Process FMEA', keywords: 'pfmea' },
      { label: 'Control Plan', to: '/control-plan', icon: ClipboardList, desc: 'Characteristics, methods, frequency, reaction', keywords: 'control plan' },
      { label: 'Inspection Plans', to: '/inspection-plan', icon: ScanLine, desc: 'What is inspected, how and how often', keywords: 'inspection plan' },
      { label: 'NCR', to: '/ncr', icon: AlertTriangle, desc: 'Nonconformance reports', keywords: 'ncr nonconformance' },
      { label: 'CAPA', to: '/capa', icon: Wrench, desc: 'Corrective and preventive actions', keywords: 'capa corrective preventive' },
      { label: '8D', to: '/8d', icon: ListChecks, desc: 'Eight-disciplines problem solving', keywords: '8d problem solving' },
      { label: 'Test & Validation', to: '/verification', icon: CopyCheck, desc: 'Verification and validation records' },
    ],
  },
  {
    id: 'service',
    label: 'Service',
    icon: Wrench,
    pages: [
      { label: 'Installed Base', to: '/service?tab=machines', icon: Factory, desc: 'Serialized machines, warranty, AMC', keywords: 'installed base warranty serial' },
      { label: 'Maintenance & Failures', to: '/service?tab=tickets', icon: Wrench, desc: 'Service tickets, root cause, spares, MTBF / MTTR', keywords: 'maintenance failure analysis tickets mtbf mttr' },
      { label: 'Maintenance Simulation', to: '/studio?focus=reliability', icon: Activity, desc: 'PM intervals, downtime, calibration, energy', keywords: 'maintenance simulation calibration' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: BookOpen,
    pages: [
      { label: 'Engineering Knowledge', to: '/knowledge', icon: BookOpen, desc: 'Laser, automation and semiconductor handbooks', keywords: 'handbook library' },
      { label: 'Knowledge Articles', to: '/articles', icon: FileText, desc: 'Engineering articles written by TEAL', keywords: 'article knowledge base' },
      { label: 'Ask Intelligence', to: '/ask', icon: MessageSquareText, desc: 'Ask a question; answered from records and handbooks (no AI model)', keywords: 'ask question copilot answer' },
      { label: 'Search', to: '/search', icon: Search, desc: 'Search everything, including technical parameters' },
      { label: 'Knowledge Graph', to: '/graph', icon: Network, desc: 'Explore relationships across the thread' },
      { label: 'Evidence', to: '/evidence', icon: FileSearch, desc: 'Evidence ledger and source registry' },
      { label: 'Lessons Learned', to: '/lessons', icon: Lightbulb, desc: 'What worked, what failed, design rules' },
      { label: 'Engineering Memory', to: '/memory', icon: Compass, desc: 'Have we solved this before?' },
      { label: 'What Can We Reuse?', to: '/reuse', icon: GitCompare, desc: 'What can we reuse?' },
      { label: 'What Is Missing?', to: '/missing', icon: ListChecks, desc: 'Gaps in the digital thread' },
      { label: 'What Changed?', to: '/changed', icon: Activity, desc: 'Dataset versions and local changes' },
      { label: 'AI Context', to: '/ai', icon: Sparkles, desc: 'Context + prompt library for your AI assistant (no API)' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    pages: [
      { label: 'Technical Documents', to: '/document-library', icon: FileText, desc: 'All referenced documents', keywords: 'documents library' },
      { label: 'Datasheets', to: '/document-library?kind=Datasheet', icon: FileText, desc: 'Component datasheets', keywords: 'datasheet' },
      { label: 'Manuals', to: '/document-library?kind=Manual', icon: BookOpen, desc: 'Manuals', keywords: 'manual' },
      { label: 'Drawings & CAD', to: '/document-library?kind=Drawing', icon: Ruler, desc: 'Drawings and CAD references', keywords: 'drawing cad' },
      { label: 'Application Notes', to: '/document-library?kind=Application%20Note', icon: FileText, desc: 'Application notes', keywords: 'application note' },
      { label: 'Test Reports', to: '/document-library?kind=Test%20Report', icon: ClipboardCheck, desc: 'Test reports and evidence', keywords: 'test report' },
      { label: 'Specifications', to: '/document-library?kind=Specification', icon: ClipboardList, desc: 'Specifications', keywords: 'specification' },
      { label: 'Document Templates', to: '/documents', icon: FileText, desc: 'PRD, RFQ, spec, BOM, POC plan, DFM, validation, MOM, reviews', keywords: 'document template prd rfq specification mom' },
      { label: 'Reports', to: '/reports', icon: BarChart3, desc: 'Printable summaries and exports' },
    ],
  },
  {
    id: 'risks',
    label: 'Risks',
    icon: ShieldAlert,
    pages: [{ label: 'Risk Cockpit', to: '/execution?view=risks', icon: ShieldAlert, desc: 'Risk matrix across projects, POCs and products', keywords: 'risk cockpit matrix' }],
  },
  {
    id: 'business',
    label: 'Business Case',
    icon: Landmark,
    pages: [
      { label: 'Commercial Intelligence', to: '/opportunity-matrix', icon: Grid3x3, desc: 'Every opportunity against the same strategic questions', keywords: 'opportunity matrix strategic relevance commercial' },
      { label: 'Business Value', to: '/value', icon: Gauge, desc: 'Records held, reuse, domain coverage, development visibility', keywords: 'value metrics reuse coverage' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Settings2,
    pages: [
      { label: 'Master Data', to: '/admin', icon: Settings2, desc: 'Drafts, change packages, backup, import, lock', keywords: 'data workspace admin master data' },
      { label: 'Data Governance', to: '/data-review', icon: ShieldCheck, desc: 'Data Review Center: new, changed, conflicting, duplicate, missing, stale, unverified', keywords: 'data review governance conflicts duplicates stale' },
      { label: 'Data Health', to: '/data-quality', icon: HeartPulse, desc: 'Records, valid, warnings, errors, duplicates, missing sources', keywords: 'data quality validation' },
      { label: 'Import / Export & Backup', to: '/import-export', icon: ArrowDownUp, desc: 'CSV / JSON export, change packages, backup and restore, legacy import', keywords: 'import export backup restore' },
      { label: 'Duplicates', to: '/duplicates', icon: CopyCheck, desc: 'Likely duplicate records — review, never auto-merged', keywords: 'dedupe duplicate merge' },
      { label: 'System Configuration', to: '/settings', icon: Cog, desc: 'Appearance, view mode, workspace, providers, security limits', keywords: 'settings configuration' },
      { label: 'Legacy Applications', to: '/legacy', icon: Layers, desc: 'The original simulator, cost platform and PM tracker' },
      { label: 'Help', to: '/help', icon: Lightbulb, desc: 'Concepts, workflows, shortcuts, glossary' },
    ],
  },
];

export const ALL_PAGES: (NavPage & { section: NavSection })[] = SECTIONS.flatMap((s) => s.pages.map((p) => ({ ...p, section: s })));

/** Best page match for a pathname (longest prefix). */
export function pageFor(pathname: string): (NavPage & { section: NavSection }) | undefined {
  if (pathname === '/') return ALL_PAGES[0];
  const path = (p: NavPage) => p.to.split('?')[0];
  // longest matching path wins; among equal paths the entry without a query (the page itself) wins
  return ALL_PAGES.filter((p) => p.to !== '/' && (pathname === path(p) || pathname.startsWith(`${path(p)}/`))).sort((a, b) => path(b).length - path(a).length || Number(a.to.includes('?')) - Number(b.to.includes('?')))[0];
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
  { id: 'engineering', label: 'Engineering', desc: 'Everything, in the master IA order', icon: Cog, focus: ['home', 'intelligence', 'industries', 'applications', 'requirements', 'products', 'simulation', 'engineering', 'bom', 'suppliers', 'projects', 'quality', 'service', 'knowledge', 'documents', 'risks', 'business', 'admin'] },
  { id: 'product', label: 'Product Management', desc: 'Portfolio, requirements, simulation, POCs, projects, suppliers, cost', icon: Target, focus: ['home', 'products', 'requirements', 'simulation', 'projects', 'bom', 'suppliers', 'business'] },
  { id: 'laser', label: 'Laser', desc: 'Sources, optics, process, simulation, calculators', icon: Crosshair, focus: ['home', 'simulation', 'engineering', 'applications', 'intelligence'] },
  { id: 'semiconductor', label: 'Semiconductor', desc: 'Value chain, equipment, localization', icon: Cpu, focus: ['home', 'industries', 'simulation', 'intelligence', 'suppliers'] },
  { id: 'supply', label: 'Supply Chain', desc: 'Suppliers, BOMs, RFQs, cost, localization', icon: Truck, focus: ['home', 'suppliers', 'bom', 'projects'] },
  { id: 'intelligence', label: 'Intelligence', desc: 'Engineering database, technology, market, knowledge', icon: Globe2, focus: ['home', 'intelligence', 'industries', 'knowledge', 'documents'] },
  { id: 'executive', label: 'Executive', desc: 'Pipeline, readiness, risks, business case', icon: BarChart3, focus: ['home', 'business', 'risks', 'projects', 'products'] },
];
export const workspaceDef = (id: WorkspaceId) => WORKSPACES.find((w) => w.id === id) ?? WORKSPACES[0];

export function orderedSections(ws: WorkspaceId): { section: NavSection; primary: boolean }[] {
  const def = workspaceDef(ws);
  const primary = def.focus.map((id) => SECTIONS.find((s) => s.id === id)!).filter(Boolean);
  const rest = SECTIONS.filter((s) => !def.focus.includes(s.id));
  return [...primary.map((section) => ({ section, primary: true })), ...rest.map((section) => ({ section, primary: false }))];
}
