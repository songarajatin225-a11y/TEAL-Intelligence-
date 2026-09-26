import { useState } from 'react';
import { Link } from 'react-router-dom';
import { capability } from '../../calculations/quality';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Card, Field, Loading, Notice, PageHeader, Select, Textarea } from '../../components/ui';
import type { AcceptanceProtocol, Project } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { gateHealth } from '../../services/gates';
import { protocolSummary } from '../../services/fatSat';
import { useChecklists } from './FatSatPage';

/** PRODUCTION RELEASE — G10 (spec §75): SAT, run-at-rate, capability, training, spares, documentation, open issues. */
export default function ProductionReleasePage() {
  const projects = useRecords<Project>('project');
  const protos = useRecords<AcceptanceProtocol>('acceptance');
  const ck = useChecklists();
  const [pid, setPid] = useState(projects[0]?.id ?? '');
  const [data, setData] = useState('');
  const [lsl, setLsl] = useState('');
  const [usl, setUsl] = useState('');
  const p = projects.find((x) => x.id === pid);
  const sat = protos.filter((x) => x.project_id === pid && x.phase === 'SAT');
  const satSum = sat[0] ? protocolSummary(sat[0]) : null;
  const vals = data.split(/[\s,;]+/).map(Number).filter((x) => Number.isFinite(x));
  const cap = capability(vals, { lsl: lsl === '' ? null : Number(lsl), usl: usl === '' ? null : Number(usl) });
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Validation" title="Production release (G10)" subtitle="Ownership transfers only when ramp targets are sustained, capability is confirmed on production lots, training is complete and spares are on site." />
      <Select aria-label="Project" value={pid} onChange={(e) => setPid(e.target.value)} className="max-w-md">
        {projects.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </Select>
      {p && (
        <div className="grid gap-3 xl:grid-cols-2">
          <Card title="Status">
            <ul className="space-y-1">
              <li>
                G9 SAT readiness: <Badge>{gateHealth(p, 'G9')}</Badge> · G10: <Badge>{gateHealth(p, 'G10')}</Badge>
              </li>
              <li>
                SAT protocol: {sat[0] ? <RecordLink id={sat[0].id} /> : <Badge tone="warn">none</Badge>} {satSum && `— ${satSum.pass} pass, ${satSum.fail} fail, ${satSum.notRun} not run`}
              </li>
            </ul>
            <div className="mt-2 text-[11px] font-semibold uppercase text-ink-3">G10 checklist (Automation Handbook §57.14)</div>
            {ck ? (
              <ul className="list-disc pl-5">
                {ck.production_release.items.map((i) => (
                  <li key={i.item}>{i.item}</li>
                ))}
              </ul>
            ) : (
              <Loading />
            )}
            <Link to={`/record/${p.id}`} className="mt-2 inline-block text-[12px] text-accent-2">
              Record the G10 decision in the project →
            </Link>
          </Card>
          <Card title="Capability on production lots">
            <Notice tone="info">Paste measured values from production lots. Capability is refused below 30 values and without specification limits.</Notice>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="LSL" htmlFor="pr-l">
                <input id="pr-l" className="w-full rounded-md border border-line bg-panel px-2 py-1.5" value={lsl} onChange={(e) => setLsl(e.target.value)} />
              </Field>
              <Field label="USL" htmlFor="pr-u">
                <input id="pr-u" className="w-full rounded-md border border-line bg-panel px-2 py-1.5" value={usl} onChange={(e) => setUsl(e.target.value)} />
              </Field>
            </div>
            <Textarea aria-label="Measured values" placeholder="values separated by spaces, commas or new lines" value={data} onChange={(e) => setData(e.target.value)} className="mt-2" />
            <div className="mt-2 text-[12.5px]">
              {cap.message}
              {cap.status === 'CALCULATED' && (
                <div className="num">
                  n={cap.n} · mean {cap.mean?.toFixed(4)} · σ {cap.sigma_overall?.toFixed(4)} · Cp {cap.cp.value?.toFixed(2)} · Cpk {cap.cpk.value?.toFixed(2)} · Pp {cap.pp.value?.toFixed(2)} · Ppk {cap.ppk.value?.toFixed(2)} · Cpk lower bound {cap.cpk_lower_bound.value?.toFixed(2)}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
