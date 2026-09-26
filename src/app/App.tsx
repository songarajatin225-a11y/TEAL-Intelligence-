import { lazy } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { EntityListPage } from '../features/entities/EntityListPage';
import { DataProvider } from '../hooks/useData';
import { Layout } from './Layout';
import { RouteError } from './RouteError';
import { WorkspaceLockGate } from './WorkspaceLock';

const L = (f: () => Promise<{ default: React.ComponentType }>) => {
  const C = lazy(f);
  return <C />;
};
const list = (entity: string, props: Record<string, unknown> = {}) => <EntityListPage entity={entity} {...props} />;

// HashRouter-style routing: GitHub Pages has no server-side rewrites, so deep links use #/…
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    // pathless wrapper: a page crash renders RouteError inside the layout (navigation stays usable)
    children: [
      {
        errorElement: <RouteError />,
        children: [
      { index: true, element: L(() => import('../features/command-center/CommandCenter')) },
      { path: 'dashboards', element: L(() => import('../features/command-center/Dashboards')) },
      { path: 'pm', element: L(() => import('../features/product-manager/PmWorkspace')) },
      { path: 'activities', element: list('activity') },
      { path: 'products', element: L(() => import('../features/products/ProductsPage')) },
      { path: 'configurator', element: L(() => import('../features/configurator/ConfiguratorPage')) },
      { path: 'platformization', element: L(() => import('../features/products/PlatformizationPage')) },
      { path: 'customers', element: list('customer') },
      { path: 'companies', element: list('company', { intro: 'Companies known to the OS: handbook-named suppliers (with evidence), legacy vendors and user-created records. Country, products and India presence stay UNKNOWN until curated.' }) },
      { path: 'opportunities', element: L(() => import('../features/opportunities/OpportunitiesPage')) },
      { path: 'inquiry', element: L(() => import('../features/inquiry/InquiryPage')) },
      { path: 'requirements', element: list('requirement', { intro: 'Customer statement → URS → SRS → FRS → design → test → FAT → SAT. Every requirement needs a value, condition, verification method and acceptance criterion (Automation Handbook Part 2).' }) },
      { path: 'traceability', element: L(() => import('../features/requirements/TraceabilityPage')) },
      { path: 'applications', element: L(() => import('../features/applications/ApplicationsPage')) },
      { path: 'materials', element: list('material') },
      { path: 'laser', element: L(() => import('../features/laser/LaserPlatformPage')) },
      { path: 'laser-sources', element: L(() => import('../features/laser/LaserPage')) },
      { path: 'optics', element: list('optic', { intro: 'Optics database. Objectives from the TEAL configurator; coating, damage threshold and manufacturer are UNKNOWN until curated from datasheets.' }) },
      { path: 'galvo', element: list('galvo', { intro: 'Galvo / scanner database. No scanner records are curated yet — add them from official datasheets via the ingestion pipeline (docs/INGESTION.md).' }) },
      { path: 'calculators', element: L(() => import('../features/calculators/CalculatorsPage')) },
      { path: 'formulas', element: list('formula', { intro: 'Automation Equipment Building Handbook Part 54 — 177 formulas. "In calculator" marks formulas implemented in the OS calculation engine.' }) },
      { path: 'process', element: L(() => import('../features/process/ProcessEnginePage')) },
      { path: 'poc', element: list('poc', { title: 'POCs', intro: 'Customer requirement → objective → sample → laser → optics → parameters → DOE → measurement → result → process window → decision. Results are never pre-filled.' }) },
      { path: 'doe', element: list('doe', { title: 'DOE Studies' }) },
      { path: 'machines', element: L(() => import('../features/machines/MachinesPage')) },
      { path: 'architecture', element: L(() => import('../features/machines/ArchitecturePage')) },
      { path: 'modules', element: list('module', { intro: 'Module library (catalogue Ch. 13 automation modules, LaserSuite editions, connectivity/compliance). Module DNA fields are UNKNOWN until documented; list prices are ESTIMATES.' }) },
      { path: 'reuse', element: L(() => import('../features/knowledge/ReusePage')) },
      { path: 'semiconductor', element: L(() => import('../features/semiconductor/SemiconductorPage')) },
      { path: 'equipment-buyer', element: L(() => import('../features/semiconductor/EquipmentBuyerPage')) },
      { path: 'suppliers', element: list('supplier') },
      { path: 'rfq', element: list('rfq', { title: 'RFQs', intro: 'Generate RFQs from a BOM (open a BOM → Generate RFQ), then record quotations, compliance and deviations and compare.' }) },
      { path: 'procurement', element: L(() => import('../features/suppliers/ProcurementPage')) },
      { path: 'bom', element: L(() => import('../features/bom/BomPage')) },
      { path: 'items', element: list('component', { title: 'Components', intro: 'TEAL stock-code structure from the legacy cost platform. Prices, vendors and lead times are DEMO seed values — not quotations.' }) },
      { path: 'cost', element: L(() => import('../features/cost/CostPage')) },
      { path: 'projects', element: list('project') },
      { path: 'gates', element: L(() => import('../features/gates/GatesPage')) },
      { path: 'quality', element: list('risk', { title: 'Risk & FMEA', intro: 'Risk register, DFMEA, PFMEA, machine FMEA and process risk. RPN = S·O·D (Handbook Q10) is computed only when all three are scored.' }) },
      { path: 'decisions', element: list('decision', { title: 'Engineering Decisions' }) },
      { path: 'changes', element: list('change_request', { title: 'Change Requests' }) },
      { path: 'fat-sat', element: L(() => import('../features/fat-sat/FatSatPage')) },
      { path: 'production-release', element: L(() => import('../features/fat-sat/ProductionReleasePage')) },
      { path: 'localization', element: L(() => import('../features/localization/LocalizationPage')) },
      { path: 'technology', element: L(() => import('../features/technology/TechnologyRadarPage')) },
      { path: 'roadmap', element: L(() => import('../features/roadmap/RoadmapPage')) },
      { path: 'global', element: L(() => import('../features/global-intelligence/GlobalIntelligencePage')) },
      { path: 'knowledge/*', element: L(() => import('../features/knowledge/KnowledgePage')) },
      { path: 'search', element: L(() => import('../features/knowledge/SearchPage')) },
      { path: 'memory', element: L(() => import('../features/knowledge/MemoryPage')) },
      { path: 'missing', element: L(() => import('../features/knowledge/MissingPage')) },
      { path: 'changed', element: L(() => import('../features/knowledge/ChangedPage')) },
      { path: 'graph', element: L(() => import('../features/knowledge/GraphPage')) },
      { path: 'evidence', element: L(() => import('../features/knowledge/EvidencePage')) },
      { path: 'lessons', element: list('lesson', { title: 'Lessons Learned', intro: 'What worked, what failed, why, corrective action and the design rule — linked to product, module, supplier, process, project and customer. Lessons come from real work; none are seeded.' }) },
      { path: 'ai', element: L(() => import('../features/knowledge/AiPage')) },
      { path: 'service', element: L(() => import('../features/service/ServicePage')) },
      { path: 'admin', element: L(() => import('../features/admin/AdminPage')) },
      { path: 'data-quality', element: L(() => import('../features/admin/DataQualityPage')) },
      { path: 'reports', element: L(() => import('../features/admin/ReportsPage')) },
      { path: 'help', element: L(() => import('../features/admin/HelpPage')) },
      { path: 'legacy', element: L(() => import('../features/admin/LegacyAppsPage')) },
      { path: 'legacy/:app', element: L(() => import('../features/admin/LegacyAppsPage')) },
      { path: 'record/:id', element: L(() => import('../features/entities/RecordPage')) },
      { path: '*', element: L(() => import('../features/admin/NotFound')) },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <WorkspaceLockGate>
      <DataProvider>
        <RouterProvider router={router} />
      </DataProvider>
    </WorkspaceLockGate>
  );
}
