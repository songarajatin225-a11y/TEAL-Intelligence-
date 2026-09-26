import { useMemo } from 'react';
import { RecordLink } from '../../components/RecordLink';
import { StatusBadge } from '../../components/badges';
import { Badge, Card, EmptyState, Notice, PageHeader, Stat, Table } from '../../components/ui';
import type { Bom, Rfq } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';

/**
 * PROCUREMENT (spec §53, §113). V1 tracks procurement from BOM lines and RFQs: long-lead items,
 * risk, alternates, import items and RFQ status. Purchase requisitions / purchase orders are an
 * ERP function — PR/PO records are on the roadmap (P1) and are not simulated here.
 */
export default function ProcurementPage() {
  const boms = useRecords<Bom>('bom');
  const rfqs = useRecords<Rfq>('rfq');
  const lines = useMemo(() => boms.flatMap((b) => b.lines.filter((l) => l.make_buy === 'Buy').map((l) => ({ b, l }))), [boms]);
  const longLead = lines.filter(({ l }) => (l.lead_time_weeks ?? 0) >= 12);
  const risky = lines.filter(({ l }) => l.risk === 'High');
  const noSup = lines.filter(({ l }) => !l.supplier);
  const noAlt = lines.filter(({ l }) => !l.alternate && l.import_item);
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Suppliers" title="Procurement" subtitle="Bought items across BOMs, RFQ status, long-lead items, risk, alternates and imports. Latest-PO-date logic follows Handbook C3: t_PO = t_need − (LT + transit + customs + IQC)." />
      <Notice tone="info">PR / PO / incoming-QC records live in the ERP. They are not simulated in V1; this view is driven by BOM lines and RFQs.</Notice>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Stat label="Bought lines" value={lines.length} />
        <Stat label="Long-lead ≥12 wk" value={longLead.length} tone={longLead.length ? 'warn' : undefined} />
        <Stat label="High-risk lines" value={risky.length} tone={risky.length ? 'bad' : undefined} />
        <Stat label="No supplier" value={noSup.length} tone={noSup.length ? 'warn' : undefined} />
        <Stat label="Imports without alternate" value={noAlt.length} />
      </div>
      <Card title="RFQs">
        {rfqs.length ? (
          <Table head={['RFQ', 'Status', 'Items', 'Suppliers', 'Quotes']} dense>
            {rfqs.map((r) => (
              <tr key={r.id}>
                <td>
                  <RecordLink id={r.id} />
                </td>
                <td>
                  <StatusBadge s={r.rfq_status} />
                </td>
                <td className="num">{r.items.length}</td>
                <td className="num">{r.supplier_ids.length}</td>
                <td className="num">{r.quotes.length}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="No RFQs" explain="Open a BOM and choose “Generate RFQ”." />
        )}
      </Card>
      <Card title="Bought lines needing attention">
        <Table head={['BOM', 'Line', 'Supplier', 'Lead time', 'Risk', 'Alternate', 'Import']} dense>
          {[...longLead, ...risky, ...noSup].slice(0, 100).map(({ b, l }, i) => (
            <tr key={`${b.id}-${l.line_id}-${i}`}>
              <td>
                <RecordLink id={b.id} />
              </td>
              <td>{l.description}</td>
              <td>{l.supplier ?? <Badge tone="warn">none</Badge>}</td>
              <td className="num">{l.lead_time_weeks ?? '—'}</td>
              <td>{l.risk ?? '—'}</td>
              <td>{l.alternate ?? '—'}</td>
              <td>{l.import_item ? 'yes' : ''}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
