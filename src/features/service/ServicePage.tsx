import { useState } from 'react';
import { Card, Field, Input, PageHeader, Stat, Tabs, Unknown } from '../../components/ui';
import type { Machine, ServiceTicket } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { todayIso } from '../../utils/dates';
import { EntityListPage } from '../entities/EntityListPage';

/** FIELD SERVICE (spec §77, §115): installed machines, warranty, AMC, issues, spares, MTBF, MTTR. */
export default function ServicePage() {
  const machines = useRecords<Machine>('machine');
  const tickets = useRecords<ServiceTicket>('service_ticket');
  const [tab, setTab] = useState<'tickets' | 'machines'>('tickets');
  const [hours, setHours] = useState('');
  const today = todayIso();
  const failures = tickets.filter((t) => t.downtime_h != null && t.downtime_h > 0);
  const mttr = failures.length ? failures.reduce((s, t) => s + (t.downtime_h ?? 0), 0) / failures.length : null;
  const mtbf = hours && failures.length ? Number(hours) / failures.length : null;
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Service" title="Field service" subtitle="Machine · issue · alarm · root cause · action · spare · technician · downtime · resolution. MTBF needs operating hours from the field — it is never assumed. No live telemetry is claimed." />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        <Stat label="Installed machines" value={machines.length} />
        <Stat label="In warranty" value={machines.filter((m) => m.warranty_until && m.warranty_until >= today).length} />
        <Stat label="Under AMC" value={machines.filter((m) => m.amc).length} />
        <Stat label="Open tickets" value={tickets.filter((t) => t.ticket_status === 'Open' || t.ticket_status === 'In Progress').length} />
        <Stat label="MTTR" value={mttr == null ? <Unknown /> : `${mttr.toFixed(1)} h`} sub="mean downtime per failure" />
        <Stat label="MTBF" value={mtbf == null ? <Unknown /> : `${mtbf.toFixed(0)} h`} sub="operating h ÷ failures" />
      </div>
      <Card>
        <Field label="Fleet operating hours in the period (for MTBF)" htmlFor="svc-h">
          <Input id="svc-h" type="number" value={hours} onChange={(e) => setHours(e.target.value)} className="w-48" />
        </Field>
      </Card>
      <Tabs label="Service" value={tab} onChange={setTab} tabs={[{ key: 'tickets', label: 'Service tickets', count: tickets.length }, { key: 'machines', label: 'Installed base', count: machines.length }]} />
      {tab === 'tickets' ? <EntityListPage entity="service_ticket" title="Service tickets" /> : <EntityListPage entity="machine" title="Installed base" />}
    </div>
  );
}
