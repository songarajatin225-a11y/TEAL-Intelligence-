import { Link } from 'react-router-dom';
import { Card, KV } from '../../components/ui';
import type { GateDefinition } from '../../domain/entities';
import type { Rec } from '../../hooks/useData';

export default function GateDefinitionView({ record }: { record: Rec }) {
  const d = record as unknown as GateDefinition;
  return (
    <Card title={d.name}>
      <KV
        items={[
          ['Inputs', d.inputs],
          ['Outputs & documents', d.outputs],
          ['Approval criteria', d.approval_criteria],
          ['Responsible', d.responsible],
          ['Exit criteria', d.exit_criteria],
          ['Mandatory evidence', <ul key="m" className="list-disc pl-5">{d.mandatory_evidence.map((e) => <li key={e}>{e}</li>)}</ul>],
          ['Customer-facing', d.customer_facing ? 'Yes — customer signature required' : 'No'],
        ]}
      />
      <Link to="/knowledge/automation/83-design-review-gates-g0-g10.md" className="mt-2 inline-block text-[12px] text-accent-2 hover:underline">
        Read the handbook section →
      </Link>
    </Card>
  );
}
