import { Link } from 'react-router-dom';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Card, EmptyState, PageHeader, Table } from '../../components/ui';
import type { GateDefinition, Project } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { gateHealth } from '../../services/gates';

const TONE = { passed: 'ok', conditional: 'warn', failed: 'bad', in_review: 'info', not_started: 'neutral' } as const;

/** G0–G10 — definitions (Automation Handbook) + portfolio gate health. */
export default function GatesPage() {
  const defs = useRecords<GateDefinition>('gate_definition').sort((a, b) => a.order - b.order);
  const projects = useRecords<Project>('project');
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Governance" title="Design Gates G0–G10" subtitle="“A gate is a decision, not a meeting: the project proceeds only when the exit criteria are met, or when named risks are consciously accepted by the approvers with an owner and date.” — Automation Equipment Building Handbook. A gate cannot pass with mandatory evidence missing." />
      <Card title="Portfolio gate health">
        {projects.length ? (
          <Table head={['Project', ...defs.map((d) => d.code)]} dense>
            {projects.map((p) => (
              <tr key={p.id}>
                <td>
                  <RecordLink id={p.id} />
                </td>
                {defs.map((d) => {
                  const h = gateHealth(p, d.code);
                  return (
                    <td key={d.code}>
                      <Badge tone={TONE[h]}>{h === 'not_started' ? '·' : h === 'passed' ? 'GO' : h === 'conditional' ? 'GWC' : h === 'failed' ? 'NO' : 'rev'}</Badge>
                    </td>
                  );
                })}
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="No projects" explain="Create a project, or generate a project skeleton from a customer inquiry." />
        )}
      </Card>
      <Card title="Gate definitions">
        <Table head={['Gate', 'Inputs', 'Outputs and documents (mandatory evidence)', 'Approval criteria', 'Responsible', 'Exit criteria']} dense>
          {defs.map((d) => (
            <tr key={d.code}>
              <td className="whitespace-nowrap font-semibold">
                <Link className="text-accent-2 hover:underline" to={`/record/${d.id}`}>
                  {d.name}
                </Link>
                {d.customer_facing && (
                  <div>
                    <Badge tone="info">customer</Badge>
                  </div>
                )}
              </td>
              <td>{d.inputs}</td>
              <td>{d.outputs}</td>
              <td>{d.approval_criteria}</td>
              <td>{d.responsible}</td>
              <td>{d.exit_criteria}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
