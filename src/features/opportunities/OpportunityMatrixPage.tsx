import { Grid3x3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/badges';
import { EntityDrawer } from '../../components/EntityDrawer';
import { TrustBadge } from '../../components/TrustBadge';
import { Card, EmptyState, Notice, PageHeader, Select } from '../../components/ui';
import type { Opportunity } from '../../domain/entities';
import { useData, useRecords, type Rec } from '../../hooks/useData';

const U = <span className="font-mono text-micro text-ink-3">UNKNOWN</span>;

/**
 * OPPORTUNITY MATRIX (final master prompt §28): market, industry, customer, application, technology,
 * market size, TEAL capability, partner requirement, investment, development time, localization
 * potential, strategic relevance and status — as recorded. No automatic score: scoring needs
 * criteria TEAL has defined, so none is computed here.
 */
export default function OpportunityMatrixPage() {
  const opps = useRecords<Opportunity>('opportunity');
  const { byId } = useData();
  const [domain, setDomain] = useState('');
  const [preview, setPreview] = useState<Rec | null>(null);
  const domains = useRecords('domain');
  const rows = useMemo(() => opps.filter((o) => !domain || o.domain_id === domain), [opps, domain]);
  const t = (v: unknown) => (v == null || v === '' ? U : typeof v === 'number' ? v.toLocaleString('en-IN') : String(v));
  const cols: [string, (o: Opportunity & Rec) => React.ReactNode][] = [
    ['Market', (o) => t(o.market)],
    ['Industry', (o) => t(o.industry)],
    ['Customer', (o) => (o.customer_id ? byId.get(o.customer_id)?.name ?? o.customer_id : U)],
    ['Application', (o) => (o.application_id ? byId.get(o.application_id)?.name ?? o.application_id : U)],
    ['Technology', (o) => ((o.technology_ids ?? []).length ? (o.technology_ids ?? []).map((i) => byId.get(i)?.name ?? i).join(', ') : U)],
    ['Market size', (o) => (o.market_size != null ? `${o.market_size.toLocaleString('en-IN')}${o.market_size_source ? '' : ' (unsourced)'}` : U)],
    ['TEAL capability', (o) => t(o.teal_capability)],
    ['Partner requirement', (o) => t(o.partner_requirement)],
    ['Investment', (o) => t(o.investment)],
    ['Development time', (o) => t(o.development_time)],
    ['Localization potential', (o) => t(o.localization_potential)],
    ['Strategic relevance', (o) => t(o.strategic_relevance)],
  ];
  return (
    <div className="space-y-5">
      <PageHeader
        title="Opportunity Matrix"
        subtitle="Every opportunity against the same strategic questions. Blank means not yet assessed — edit the opportunity to record it."
        actions={
          <Select aria-label="Domain" value={domain} onChange={(e) => setDomain(e.target.value)} className="w-56">
            <option value="">All domains</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        }
      />
      <Notice tone="info">No automatic scores. Ranking opportunities needs scoring criteria TEAL has defined and written down; until then the matrix shows the facts side by side.</Notice>
      {!rows.length ? (
        <EmptyState icon={Grid3x3} title="No opportunities" explain="Create an opportunity or capture a lead." compact />
      ) : (
        <Card title={`${rows.length} opportunities`} icon={Grid3x3}>
          <div className="scroll-thin overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-[70rem] text-meta">
              <thead>
                <tr className="border-b border-line text-left text-micro text-ink-3">
                  <th scope="col" className="sticky left-0 bg-solid/95 py-2 pr-3 font-medium">
                    Opportunity
                  </th>
                  <th scope="col" className="pr-3 font-medium">
                    Status
                  </th>
                  {cols.map(([h]) => (
                    <th key={h} scope="col" className="pr-3 font-medium">
                      {h}
                    </th>
                  ))}
                  <th scope="col" className="font-medium">
                    Trust
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b border-line/60 align-top">
                    <th scope="row" className="sticky left-0 bg-solid/95 py-2 pr-3 text-left font-medium">
                      <button type="button" onClick={() => setPreview(o)} className="text-left text-accent-2 hover:underline">
                        {o.name}
                      </button>
                    </th>
                    <td className="py-2 pr-3">
                      <StatusBadge s={o.stage} />
                    </td>
                    {cols.map(([h, f]) => (
                      <td key={h} className="max-w-[14rem] py-2 pr-3">
                        {f(o)}
                      </td>
                    ))}
                    <td className="py-2">
                      <TrustBadge record={o} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-micro text-ink-3">
            Edit fields on the opportunity (<Link to="/opportunities" className="text-accent-2 hover:underline">Opportunities</Link>) — the form’s later steps hold the matrix fields.
          </p>
        </Card>
      )}
      <EntityDrawer record={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
