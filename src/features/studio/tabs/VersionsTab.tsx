import { GitBranch, GitCompare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, Field, Table } from '../../../components/ui';
import { versionDiff } from '../../../services/sim/build';
import type { Sim, TabProps } from '../ScenarioPage';
import { studioPath } from '../StudioPage';
import { SmallSelect } from './edit';

export default function VersionsTab({ eng, sim }: TabProps) {
  const ancestors: Sim[] = [];
  let p = sim.parent_id ? (eng.byId.get(sim.parent_id) as Sim | undefined) : undefined;
  while (p && ancestors.length < 20) {
    ancestors.unshift(p);
    p = p.parent_id ? (eng.byId.get(p.parent_id) as Sim | undefined) : undefined;
  }
  const children = eng.sims.filter((s) => s.parent_id === sim.id);
  const family = eng.sims.filter((s) => s.id !== sim.id && (s.template_id === sim.template_id || s.parent_id === sim.id || sim.parent_id === s.id || s.parent_id === sim.parent_id));
  const [other, setOther] = useState(sim.parent_id ?? family[0]?.id ?? '');
  const o = eng.byId.get(other) as Sim | undefined;
  const diff = useMemo(() => (o ? versionDiff(o, sim, eng.byId, eng.defs, eng.fx) : null), [o, sim, eng]);
  const Node = ({ s, here }: { s: Sim; here?: boolean }) => (
    <Link to={studioPath(s.id)} className={`inline-flex min-h-8 items-center gap-2 rounded-control border px-2.5 py-1 text-meta ${here ? 'border-accent bg-accent-soft font-semibold' : 'border-line hover:border-accent'}`}>
      {s.name} <Badge>v{s.version ?? 1}</Badge>
    </Link>
  );
  return (
    <div className="space-y-4">
      <Card title="Version and configuration tree" icon={GitBranch} description="Base → variant → customer / project configuration. A derived scenario never overwrites its parent (§134, §143).">
        <ol className="flex flex-wrap items-center gap-2">
          {ancestors.map((a) => (
            <li key={a.id} className="flex items-center gap-2">
              <Node s={a} /> <span aria-hidden>→</span>
            </li>
          ))}
          <li>
            <Node s={sim} here />
          </li>
        </ol>
        {children.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-meta text-ink-3">Derived from this scenario</div>
            <ul className="flex flex-wrap gap-2">
              {children.map((c) => (
                <li key={c.id}>
                  <Node s={c} />
                  <div className="text-micro text-ink-3">{c.change_reason}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {sim.change_reason && <p className="mt-2 text-meta">Change reason for this version: {sim.change_reason}</p>}
      </Card>
      <Card title="Equipment version diff" icon={GitCompare} description="Components, laser parameters, stations, suppliers, requirements and results (§144)">
        <div className="mb-3 max-w-md">
          <Field label="Compare with">
            <SmallSelect label="Compare with" value={other} options={[{ value: '', label: 'Choose a scenario' }, ...family.map((s) => ({ value: s.id, label: `${s.name} (v${s.version ?? 1})` }))]} onChange={setOther} className="w-full" />
          </Field>
        </div>
        {diff && o ? (
          <div className="space-y-4">
            <Table head={['Result', o.scenario_label ? `Scenario ${o.scenario_label}` : 'Other', sim.scenario_label ? `Scenario ${sim.scenario_label} (this)` : 'This']} dense>
              {diff.metrics.map((m) => (
                <tr key={m.metric}>
                  <td>{m.metric}</td>
                  <td className="num">{m.before}</td>
                  <td className="num font-semibold">{m.after}</td>
                </tr>
              ))}
            </Table>
            <Table head={['Station', 'Component', 'Before', 'After']} dense>
              {diff.components.length ? (
                diff.components.map((c) => (
                  <tr key={`${c.station}|${c.role}`}>
                    <td>{c.station}</td>
                    <td>{c.role}</td>
                    <td>{c.before ?? '—'}</td>
                    <td className="font-semibold">{c.after ?? 'removed'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-ink-3">
                    No component changes
                  </td>
                </tr>
              )}
            </Table>
            <Table head={['Station', 'Parameter', 'Before', 'After']} dense>
              {[...diff.laser.map((l) => ({ ...l, field: `laser ${l.field}` })), ...diff.stations].map((x, i) => (
                <tr key={i}>
                  <td>{x.station}</td>
                  <td>{x.field.replace(/_/g, ' ')}</td>
                  <td className="num">{x.before}</td>
                  <td className="num font-semibold">{x.after}</td>
                </tr>
              ))}
              {!diff.laser.length && !diff.stations.length && (
                <tr>
                  <td colSpan={4} className="text-ink-3">
                    No station or laser parameter changes
                  </td>
                </tr>
              )}
            </Table>
            <div className="grid grid-cols-1 gap-3 text-meta md:grid-cols-2">
              <div>
                <strong>Suppliers:</strong> {diff.suppliers.before.join(', ') || '—'} → {diff.suppliers.after.join(', ') || '—'}
              </div>
              <div>
                <strong>Requirements:</strong> {diff.requirements.added.length ? `+${diff.requirements.added.join(', ')}` : 'none added'}; {diff.requirements.removed.length ? `−${diff.requirements.removed.join(', ')}` : 'none removed'}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-meta text-ink-3">Choose a scenario to compare with.</p>
        )}
      </Card>
    </div>
  );
}
