import { Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Card, Chain, Notice, PageHeader } from '../../components/ui';
import { useData } from '../../hooks/useData';

type Step = { label: string; to?: string; gap?: string };
interface UseCase {
  id: string;
  title: string;
  summary: string;
  demo?: string;
  engine: string;
  steps: Step[];
}

/**
 * CROSS-DOMAIN USE CASES (final master prompt §56). Five walkthroughs; each step opens the page or
 * record that does that job. Where TEAL has no data for a step, the step is marked as a gap —
 * that is the honest state of the knowledge, and the next thing to work on.
 */
const CASES: UseCase[] = [
  {
    id: 'pcb-marking',
    title: '1 · Laser PCB marking',
    summary: 'A customer needs traceability marks on PCBs: which wavelength, which platform, what it costs.',
    demo: 'opp-demo-pcb-co2',
    engine: '/solution?domain=electronics&industry=ind-ems&material=mat-fr4&process=Marking',
    steps: [
      { label: 'Customer', to: '/customers' },
      { label: 'PCB marking requirement', to: '/capture' },
      { label: 'Material (FR4)', to: '/record/mat-fr4' },
      { label: 'UV / Fiber / CO₂ evaluation', to: '/compare?ids=las-uv,las-fiber,las-co2' },
      { label: 'Laser selection', to: '/solution?domain=electronics&industry=ind-ems&material=mat-fr4&process=Marking' },
      { label: 'Galvo', to: '/galvo' },
      { label: 'F-theta', to: '/optics' },
      { label: 'Vision', to: '/modules' },
      { label: 'Machine architecture', to: '/product-architecture?product=markc2i' },
      { label: 'BOM', to: '/bom' },
      { label: 'Cost', to: '/cost' },
      { label: 'POC', to: '/poc' },
    ],
  },
  {
    id: 'package-marking',
    title: '2 · Semiconductor package marking',
    summary: 'Mould-compound package marking with grading, from requirement to validation.',
    demo: 'opp-demo-pkg-marking',
    engine: '/solution?domain=semiconductor&industry=ind-semi&material=mat-emc&process=Marking',
    steps: [
      { label: 'Semiconductor', to: '/domains/semiconductor' },
      { label: 'Package', to: '/record/mat-emc' },
      { label: 'Marking requirement', to: '/capture' },
      { label: 'UV laser', to: '/record/las-uv' },
      { label: 'Galvo', to: '/galvo' },
      { label: 'Vision', to: '/modules' },
      { label: 'Inspection', to: '/modules' },
      { label: 'Machine', to: '/solution?domain=semiconductor&industry=ind-semi&material=mat-emc&process=Marking' },
      { label: 'Validation', to: '/fat-sat' },
    ],
  },
  {
    id: 'tab-welding',
    title: '3 · Battery tab welding',
    summary: 'Copper / aluminium tab welding for cells — TEAL has catalogue applications on the Weld B-Series.',
    demo: 'opp-demo-battery-tab',
    engine: '/solution?domain=battery&industry=ind-battery&material=mat-cu&process=Welding',
    steps: [
      { label: 'Battery', to: '/domains/battery' },
      { label: 'Cell format', to: '/domains/battery' },
      { label: 'Material (Cu / Al)', to: '/record/mat-cu' },
      { label: 'Tab welding', to: '/record/app-weldb.tab' },
      { label: 'Laser technology', to: '/solution?domain=battery&industry=ind-battery&material=mat-cu&process=Welding&app=app-weldb.tab' },
      { label: 'Beam delivery', to: '/laser' },
      { label: 'Motion', to: '/modules' },
      { label: 'Vision', to: '/modules' },
      { label: 'Welding machine', to: '/record/prd-weldb' },
      { label: 'Process validation', to: '/poc' },
    ],
  },
  {
    id: 'depaneling',
    title: '4 · EMS depaneling',
    summary: 'Separating PCBs from panels: laser or mechanical. TEAL has no catalogued laser-depaneling application yet.',
    demo: 'opp-demo-depaneling',
    engine: '/solution?domain=electronics&industry=ind-ems&material=mat-fr4',
    steps: [
      { label: 'PCB', to: '/domains/electronics' },
      { label: 'Panel', to: '/domains/electronics' },
      { label: 'Depaneling requirement', to: '/capture' },
      { label: 'Laser / mechanical evaluation', gap: 'no application record — POC needed' },
      { label: 'Machine architecture', gap: 'depends on the evaluation' },
      { label: 'Fume extraction', to: '/record/mod-fume' },
      { label: 'Vision', to: '/modules' },
      { label: 'BOM', gap: 'no machine yet' },
      { label: 'Cost', gap: 'no BOM yet' },
    ],
  },
  {
    id: 'dicing',
    title: '5 · Semiconductor dicing',
    summary: 'Wafer dicing by laser or blade. TEAL’s data covers wafer marking, not dicing — the gaps show what to learn first.',
    demo: 'opp-demo-wafer-dicing',
    engine: '/solution?domain=semiconductor&industry=ind-semi&material=mat-si',
    steps: [
      { label: 'Wafer', to: '/domains/semiconductor' },
      { label: 'Material (Si)', to: '/record/mat-si' },
      { label: 'Thickness', gap: 'customer input' },
      { label: 'Dicing requirement', to: '/capture' },
      { label: 'Laser / mechanical dicing', gap: 'no application record — study needed' },
      { label: 'Motion', to: '/modules' },
      { label: 'Optics', to: '/optics' },
      { label: 'Inspection', to: '/modules' },
      { label: 'Equipment architecture', to: '/domains/semiconductor' },
    ],
  },
];

export default function UseCasesPage() {
  const { byId } = useData();
  return (
    <div className="space-y-5">
      <PageHeader title="Use Cases" subtitle="Five cross-domain walkthroughs of the TEAL flow — requirement to technology to machine to cost and validation. Each step opens where that work happens." />
      <Notice tone="info">The demo opportunities behind these walkthroughs use fictional customers (DEMO DATA). Dashed steps are real gaps in TEAL’s data today.</Notice>
      {CASES.map((c) => {
        const demo = c.demo ? byId.get(c.demo) : undefined;
        return (
          <Card
            key={c.id}
            title={c.title}
            icon={Route}
            description={c.summary}
            actions={
              <>
                {demo && (
                  <Link to={recordPath(demo.id)} className="text-meta text-accent-2 hover:underline">
                    Demo opportunity
                  </Link>
                )}
                <Link to={c.engine} className="text-meta font-medium text-accent-2 hover:underline">
                  Run in the engine →
                </Link>
              </>
            }
          >
            <Chain label={c.title} steps={c.steps.map((s) => ({ label: s.label, to: s.to, sub: s.gap, state: s.gap ? 'gap' : 'todo' }))} />
          </Card>
        );
      })}
    </div>
  );
}
