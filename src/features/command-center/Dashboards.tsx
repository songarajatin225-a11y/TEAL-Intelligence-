import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { Card, PageHeader, Stat, Tabs } from '../../components/ui';
import { OPPORTUNITY_STAGES, type AcceptanceProtocol, type Bom, type CostModel, type Opportunity, type Project, type Risk } from '../../domain/entities';
import { summarizeCostModel, useFx } from '../../hooks/useCost';
import { useData } from '../../hooks/useData';
import { gateHealth } from '../../services/gates';
import { isActive } from '../../services/nextAction';
import { protocolSummary } from '../../services/fatSat';

type Tab = 'management' | 'engineering' | 'procurement' | 'quality' | 'service';

/** Role dashboards (spec §110–§115). The Product Manager dashboard is the PM workspace. */
export default function Dashboards() {
  const { records } = useData();
  const fx = useFx();
  const [tab, setTab] = useState<Tab>('management');
  const d = useMemo(() => {
    const of = <T,>(e: string) => records.filter((r) => r.entity === e) as unknown as T[];
    const opps = of<Opportunity>('opportunity');
    const projects = of<Project>('project');
    const risks = of<Risk>('risk');
    const boms = of<Bom>('bom');
    const cms = of<CostModel>('cost_model');
    const protos = of<AcceptanceProtocol>('acceptance');
    const buyLines = boms.flatMap((b) => b.lines.filter((l) => l.make_buy === 'Buy'));
    return {
      opps,
      projects,
      risks,
      boms,
      cms,
      protos,
      buyLines,
      pipeline: OPPORTUNITY_STAGES.map((s) => ({ stage: s, count: opps.filter((o) => o.stage === s).length })),
      gateRows: ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'].map((g) => ({ gate: g, passed: projects.filter((p) => ['passed', 'conditional'].includes(gateHealth(p, g))).length })),
      margins: cms.map((m) => ({ name: m.name.slice(0, 18), margin: +(summarizeCostModel(m, fx).c.netMargin * 100).toFixed(1) })),
    };
  }, [records, fx]);
  const count = (e: string, f?: (r: (typeof records)[number]) => boolean) => records.filter((r) => r.entity === e && (!f || f(r))).length;
  return (
    <div>
      <PageHeader eyebrow="Command Center" title="Dashboards" subtitle={<>Management · engineering · procurement · quality · service. The product-manager dashboard is the <Link className="text-accent-2" to="/pm">PM workspace</Link>. Figures are counts of records — DEMO records included and labelled where they appear.</>} />
      <Tabs label="Dashboard" value={tab} onChange={setTab} tabs={[{ key: 'management', label: 'Management' }, { key: 'engineering', label: 'Engineering' }, { key: 'procurement', label: 'Procurement' }, { key: 'quality', label: 'Quality' }, { key: 'service', label: 'Service' }]} />
      {tab === 'management' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            <Stat label="Portfolio platforms" value={count('product')} to="/products" />
            <Stat label="Active opportunities" value={d.opps.filter(isActive).length} to="/opportunities" />
            <Stat label="Active POCs" value={count('poc', isActive)} to="/poc" />
            <Stat label="Projects" value={d.projects.length} to="/projects" />
            <Stat label="Open risks" value={d.risks.filter((r) => r.risk_status === 'Open').length} to="/quality" />
            <Stat label="Localization items" value={count('localization')} to="/localization" />
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <Card title="Opportunities">
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={d.pipeline}>
                    <CartesianGrid vertical={false} stroke="var(--c-line)" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--c-ink-3)' }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--c-ink-3)' }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip cursor={{ fill: 'var(--c-accent-soft)' }} contentStyle={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: 'var(--glass-shadow)', color: 'var(--c-ink)', fontSize: 12 }} />
                    <Bar dataKey="count" fill="var(--c-accent)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Gate health (projects passed per gate)">
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={d.gateRows}>
                    <CartesianGrid vertical={false} stroke="var(--c-line)" />
                    <XAxis dataKey="gate" tick={{ fontSize: 11, fill: 'var(--c-ink-3)' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--c-ink-3)' }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip cursor={{ fill: 'var(--c-accent-soft)' }} contentStyle={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: 'var(--glass-shadow)', color: 'var(--c-ink)', fontSize: 12 }} />
                    <Bar dataKey="passed" fill="var(--c-ok)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Net margin by cost model (%)">
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={d.margins}>
                    <CartesianGrid vertical={false} stroke="var(--c-line)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--c-ink-3)' }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--c-ink-3)' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip cursor={{ fill: 'var(--c-accent-soft)' }} contentStyle={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: 'var(--glass-shadow)', color: 'var(--c-ink)', fontSize: 12 }} />
                    <Bar dataKey="margin" fill="var(--c-info)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}
      {tab === 'engineering' && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
          <Stat label="Active POCs" value={count('poc', isActive)} to="/poc" />
          <Stat label="DOEs" value={count('doe')} to="/doe" />
          <Stat label="DOEs with results" value={count('doe', (r) => ((r as unknown as { runs: { results: Record<string, number | null> }[] }).runs ?? []).some((x) => Object.values(x.results).some((v) => v != null)))} />
          <Stat label="Requirements" value={count('requirement')} to="/requirements" />
          <Stat label="Configurations" value={count('configuration')} to="/machines" />
          <Stat label="Modules" value={count('module')} to="/modules" />
          <Stat label="BOMs" value={d.boms.length} to="/bom" />
          <Stat label="Suppliers" value={count('supplier')} to="/suppliers" />
          <Stat label="FMEA lines" value={d.risks.filter((r) => r.kind !== 'Risk').length} to="/quality" />
          <Stat label="Open actions" value={records.filter((r) => r.next_action && isActive(r)).length} to="/pm" />
        </div>
      )}
      {tab === 'procurement' && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
          <Stat label="Bought lines" value={d.buyLines.length} to="/procurement" />
          <Stat label="RFQs" value={count('rfq')} to="/rfq" />
          <Stat label="Quotes received" value={records.filter((r) => r.entity === 'rfq').reduce((s, r) => s + ((r as unknown as { quotes: unknown[] }).quotes?.length ?? 0), 0)} />
          <Stat label="Long-lead ≥12 wk" value={d.buyLines.filter((l) => (l.lead_time_weeks ?? 0) >= 12).length} />
          <Stat label="High-risk lines" value={d.buyLines.filter((l) => l.risk === 'High').length} />
          <Stat label="Lines without alternate" value={d.buyLines.filter((l) => !l.alternate).length} />
          <Stat label="Quoted lines" value={d.buyLines.filter((l) => l.cost_basis === 'QUOTED').length} />
          <Stat label="Unknown-cost lines" value={d.buyLines.filter((l) => l.unit_cost == null).length} />
          <Stat label="Localization items" value={count('localization')} to="/localization" />
        </div>
      )}
      {tab === 'quality' && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
          <Stat label="Requirements" value={count('requirement')} to="/traceability" />
          <Stat label="With acceptance criterion" value={count('requirement', (r) => !!(r as { acceptance_criterion?: string }).acceptance_criterion)} />
          <Stat label="FMEA / risks" value={d.risks.length} to="/quality" />
          <Stat label="FAT protocols" value={d.protos.filter((p) => p.phase === 'FAT').length} to="/fat-sat" />
          <Stat label="SAT protocols" value={d.protos.filter((p) => p.phase === 'SAT').length} to="/fat-sat" />
          <Stat label="Failed tests" value={d.protos.reduce((s, p) => s + protocolSummary(p).fail, 0)} />
          <Stat label="NCR / CAPA" value="—" sub="not modelled in V1 (ERP/QMS)" />
          <Stat label="Change requests" value={count('change_request')} to="/changes" />
        </div>
      )}
      {tab === 'service' && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
          <Stat label="Installed machines" value={count('machine')} to="/service" />
          <Stat label="Service tickets" value={count('service_ticket')} to="/service" />
          <Stat label="Open tickets" value={count('service_ticket', (r) => ['Open', 'In Progress'].includes(String((r as { ticket_status?: string }).ticket_status)))} />
          <Stat label="Lessons learned" value={count('lesson')} to="/lessons" />
        </div>
      )}
    </div>
  );
}
