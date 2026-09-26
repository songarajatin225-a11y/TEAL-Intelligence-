import { Download, Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTypeBadge } from '../../components/badges';
import { RecordLink } from '../../components/RecordLink';
import { Button, Card, Field, PageHeader, Select, Table, Tabs } from '../../components/ui';
import type { CostModel, GateDefinition, Opportunity, Project, Requirement } from '../../domain/entities';
import { ENTITY_DEFS } from '../../domain/registry';
import { summarizeCostModel, useFx } from '../../hooks/useCost';
import { useData, useRecords } from '../../hooks/useData';
import { gateHealth, nextGate } from '../../services/gates';
import { traceMatrix } from '../../services/traceability';
import { download, stamp, toCsv } from '../../utils/export';
import { fmtDate } from '../../utils/dates';

const money = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? 'UNKNOWN' : Math.round(v).toLocaleString('en-IN'));

type Report = 'portfolio' | 'pipeline' | 'projects' | 'cost' | 'trace' | 'export';

/** REPORTS (spec §116): printable summaries of the digital thread and raw dataset exports. */
export default function ReportsPage() {
  const [tab, setTab] = useState<Report>('portfolio');
  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow="Admin"
        title="Reports"
        subtitle="Printable summaries built from current records (master + your local drafts). DEMO, ESTIMATE and UNKNOWN labels are kept in every report."
        actions={
          <Button onClick={() => window.print()}>
            <Printer className="size-3.5" /> Print / PDF
          </Button>
        }
      />
      <div className="print:hidden">
        <Tabs
          label="Report"
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'portfolio', label: 'Product portfolio' },
            { key: 'pipeline', label: 'Opportunity pipeline' },
            { key: 'projects', label: 'Project & gate status' },
            { key: 'cost', label: 'Cost summary' },
            { key: 'trace', label: 'Traceability' },
            { key: 'export', label: 'Dataset export' },
          ]}
        />
      </div>
      {tab === 'portfolio' && <Portfolio />}
      {tab === 'pipeline' && <Pipeline />}
      {tab === 'projects' && <Projects />}
      {tab === 'cost' && <Cost />}
      {tab === 'trace' && <Trace />}
      {tab === 'export' && <DatasetExport />}
      <p className="text-[11px] text-ink-3">Generated {new Date().toLocaleString()} by TEAL Engineering Intelligence OS · static GitHub Pages build · local drafts are included and marked.</p>
    </div>
  );
}

function Portfolio() {
  const products = useRecords<{ family_id?: string; maturity?: string; applications?: string[]; base_price_inr?: number | null }>('product');
  return (
    <Card title={`Product portfolio (${products.length})`}>
      <Table head={['Platform', 'Family', 'Maturity', 'Applications', 'Base price (ESTIMATE)', 'Data type']} dense>
        {products.map((p) => (
          <tr key={p.id}>
            <td>
              <RecordLink id={p.id} />
            </td>
            <td>{p.family_id ? <RecordLink id={p.family_id} /> : '—'}</td>
            <td>{p.maturity ?? 'UNKNOWN'}</td>
            <td className="num">{p.applications?.length ?? 0}</td>
            <td className="num">{p.base_price_inr != null ? `₹ ${money(p.base_price_inr)}` : 'UNKNOWN'}</td>
            <td>
              <DataTypeBadge t={p.data_type} />
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function Pipeline() {
  const opps = useRecords<Opportunity>('opportunity');
  return (
    <Card title={`Opportunities (${opps.length})`}>
      <Table head={['Opportunity', 'Customer', 'Stage', 'Value', 'Prob.', 'Next action', 'Due', 'Data type']} dense>
        {opps.map((o) => (
          <tr key={o.id}>
            <td>
              <RecordLink id={o.id} />
            </td>
            <td>{o.customer_id ? <RecordLink id={o.customer_id} /> : '—'}</td>
            <td>{o.stage}</td>
            <td className="num">{o.value != null ? money(o.value) : 'UNKNOWN'}</td>
            <td className="num">{o.probability != null ? `${o.probability}%` : '—'}</td>
            <td>{o.next_action?.action ?? <span className="text-bad">missing</span>}</td>
            <td>{fmtDate(o.next_action?.due)}</td>
            <td>
              <DataTypeBadge t={o.data_type} />
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function Projects() {
  const projects = useRecords<Project>('project');
  const defs = useRecords<GateDefinition>('gate_definition');
  const codes = [...defs].sort((a, b) => a.order - b.order).map((d) => d.code);
  return (
    <Card title={`Projects (${projects.length})`}>
      <div className="overflow-x-auto">
        <Table head={['Project', 'Status', ...codes, 'Next gate']} dense>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>
                <RecordLink id={p.id} />
              </td>
              <td>{p.status ?? '—'}</td>
              {codes.map((c) => {
                const h = gateHealth(p, c);
                return (
                  <td key={c} className={h === 'passed' ? 'text-ok' : h === 'conditional' ? 'text-warn' : h === 'not_started' ? 'text-ink-3' : 'text-bad'}>
                    {h === 'passed' ? '✔' : h === 'conditional' ? '◐' : h === 'not_started' ? '·' : '✖'}
                  </td>
                );
              })}
              <td>{nextGate(p, defs)?.code ?? 'all passed'}</td>
            </tr>
          ))}
        </Table>
      </div>
      <p className="mt-1 text-[11px] text-ink-3">✔ GO · ◐ conditional GO · ✖ HOLD / NO-GO / recycle · · not started</p>
    </Card>
  );
}

function Cost() {
  const models = useRecords<CostModel>('cost_model');
  const fx = useFx();
  const rows = useMemo(() => models.map((m) => ({ m, ...summarizeCostModel(m, fx) })), [models, fx]);
  return (
    <Card title={`Cost models (${rows.length})`}>
      <Table head={['Cost model', 'Qty', 'Cost (INR)', 'Selling (INR)', 'Net margin', 'TEAL sheet price (D)', 'Data type']} dense>
        {rows.map(({ m, c, t }) => (
          <tr key={m.id}>
            <td>
              <RecordLink id={m.id} />
            </td>
            <td className="num">{m.qty}</td>
            <td className="num">{money(c.totalCost)}</td>
            <td className="num">{money(c.selling)}</td>
            <td className="num">{Number.isFinite(c.netMargin) ? `${(c.netMargin * 100).toFixed(1)}%` : 'UNKNOWN'}</td>
            <td className="num">{money(t.D)}</td>
            <td>
              <DataTypeBadge t={m.data_type} />
            </td>
          </tr>
        ))}
      </Table>
      <p className="mt-1 text-[11px] text-ink-3">Costs use the rates, FX and markups recorded in each model. Template and DEMO models are not quotations.</p>
    </Card>
  );
}

function Trace() {
  const reqs = useRecords<Requirement>('requirement');
  const { records } = useData();
  const rows = useMemo(
    () => traceMatrix(reqs, records.filter((r) => r.entity === 'bom') as never, records.filter((r) => r.entity === 'acceptance') as never),
    [reqs, records],
  );
  return (
    <Card title={`Requirement traceability (${rows.length})`}>
      <Table head={['Requirement', 'Modules', 'BOM lines', 'FAT', 'SAT', 'Missing']} dense>
        {rows.map((r) => (
          <tr key={r.req.id}>
            <td>
              <RecordLink id={r.req.id} />
            </td>
            <td className="num">{r.modules.length}</td>
            <td className="num">{r.bomLines.length}</td>
            <td className="num">{r.fat.length}</td>
            <td className="num">{r.sat.length}</td>
            <td className={r.missing.length ? 'text-bad' : 'text-ok'}>{r.missing.join(', ') || 'complete'}</td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function DatasetExport() {
  const { records } = useData();
  const [entity, setEntity] = useState('product');
  const [origin, setOrigin] = useState<'all' | 'MASTER' | 'local'>('all');
  const rows = records.filter((r) => r.entity === entity && (origin === 'all' || (origin === 'MASTER' ? r.__origin === 'MASTER' : r.__origin !== 'MASTER')));
  const clean = rows.map(({ __origin, __dataset, ...r }) => ({ ...r, origin: __origin, dataset: __dataset }));
  const flat = clean.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v != null && typeof v === 'object' ? JSON.stringify(v) : v])));
  return (
    <Card title="Dataset export">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Entity" htmlFor="rx-e">
          <Select id="rx-e" value={entity} onChange={(e) => setEntity(e.target.value)}>
            {ENTITY_DEFS.map((d) => (
              <option key={d.entity} value={d.entity}>
                {d.plural}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Origin" htmlFor="rx-o">
          <Select id="rx-o" value={origin} onChange={(e) => setOrigin(e.target.value as 'all' | 'MASTER' | 'local')}>
            <option value="all">Master + local drafts</option>
            <option value="MASTER">Master only</option>
            <option value="local">Local drafts only</option>
          </Select>
        </Field>
        <Button disabled={!rows.length} onClick={() => download(`${entity}-${stamp()}.json`, JSON.stringify(clean, null, 2))}>
          <Download className="size-3.5" /> JSON ({rows.length})
        </Button>
        <Button disabled={!rows.length} onClick={() => download(`${entity}-${stamp()}.csv`, toCsv(flat), 'text/csv')}>
          <Download className="size-3.5" /> CSV ({rows.length})
        </Button>
      </div>
      <p className="mt-2 text-[12px] text-ink-3">CSV cells that start with =, +, - or @ are escaped against spreadsheet formula injection. Nested fields are JSON-encoded.</p>
    </Card>
  );
}
