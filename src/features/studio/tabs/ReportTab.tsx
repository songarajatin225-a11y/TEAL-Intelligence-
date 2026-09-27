import { Download, FileText, Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Markdown } from '../../../components/Markdown';
import { Button, Card, SegmentedControl } from '../../../components/ui';
import { scenarioMetrics } from '../../../services/sim/analysis';
import { simulationReport } from '../../../services/sim/report';
import { download } from '../../../utils/export';
import { todayIso } from '../../../utils/dates';
import type { TabProps } from '../ScenarioPage';

type Kind = 'simulation' | 'proposal';

export default function ReportTab({ eng, sim, d, customer }: TabProps) {
  const [kind, setKind] = useState<Kind>(customer ? 'proposal' : 'simulation');
  const effective: Kind = customer ? 'proposal' : kind;
  const md = useMemo(() => {
    const family = eng.sims.filter((s) => s.id !== sim.id && s.template_id === sim.template_id && s.customer_id === sim.customer_id);
    const compare = [sim, ...family].slice(0, 4).map((s) => scenarioMetrics(s, eng.byId, eng.defs, eng.fx));
    return simulationReport({ res: d.res, cycle: d.cycle, cap: d.cap, bom: d.bom, deps: d.deps, issues: d.issues, byId: eng.byId, compare: compare.length > 1 ? compare : undefined, today: todayIso(), mode: effective === 'proposal' ? 'customer' : 'engineering' });
  }, [eng, sim, d, effective]);
  return (
    <Card
      title={effective === 'proposal' ? 'Customer proposal' : 'Simulation report'}
      icon={FileText}
      description={effective === 'proposal' ? 'Customer-facing: application, solution, process, throughput, validation, assumptions, exclusions. Internal cost, suppliers and risks are left out.' : 'Engineering: every section of §139 — inputs, assumptions, results, BOM, cost, risks, review, validation.'}
      actions={
        <>
          {!customer && <SegmentedControl<Kind> label="Report type" size="sm" value={kind} onChange={setKind} options={[{ value: 'simulation', label: 'Simulation report' }, { value: 'proposal', label: 'Customer proposal' }]} />}
          <Button size="sm" onClick={() => download(`${effective}-${sim.id}-${todayIso()}.md`, md, 'text/markdown')}>
            <Download className="size-3.5" aria-hidden /> Markdown
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-3.5" aria-hidden /> Print / PDF
          </Button>
        </>
      }
    >
      <article className="print-area">
        <Markdown source={md} shift={1} />
      </article>
    </Card>
  );
}
