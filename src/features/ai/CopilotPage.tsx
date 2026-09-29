import { useSearchParams } from 'react-router-dom';
import { Badge, PageHeader } from '../../components/ui';
import { useData } from '../../hooks/useData';
import { pageContext } from '../../services/ai/context';
import { Copilot } from './Copilot';

/** Full-page Copilot (/copilot?q=…&ctx=<record id>). */
export default function CopilotPage() {
  const [params] = useSearchParams();
  const { byId } = useData();
  const ctxId = params.get('ctx');
  const ctx = ctxId ? pageContext(`/record/${ctxId}`, byId) : null;
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            TEAL Copilot <Badge tone="accent">BETA</Badge>
          </span>
        }
        subtitle="Ask, explain, compare, configure, find alternatives, check compatibility, generate BOM / RFQ / URS, analyse cost and change impact — every answer shows its evidence, assumptions, gaps and confidence."
      />
      <Copilot context={ctx && ctx.kind !== 'none' ? ctx : null} mode="page" initialQuery={params.get('q') ?? undefined} />
    </div>
  );
}
