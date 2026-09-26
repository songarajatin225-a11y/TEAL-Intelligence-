import { ArrowRight, Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, PageHeader } from '../../components/ui';
import type { Domain } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { domainPath } from './DomainPage';

/** DOMAIN ARCHITECTURE (final master prompt §04): the same intelligence system across industries. */
export default function DomainsPage() {
  const domains = [...useRecords<Domain>('domain')].sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Domains"
        subtitle="One intelligence system across industries. Laser comes first; the same model — lifecycle, applications, technologies, equipment, suppliers, cost — extends to every domain. A new domain is a new data record, not a redesign."
        actions={
          <Link to="/cross-domain" className="inline-flex items-center gap-1.5 text-meta font-medium text-accent-2 hover:underline">
            <Network className="size-4" aria-hidden /> Cross-domain map
          </Link>
        }
      />
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Domains">
        {domains.map((d) => (
          <li key={d.id}>
            <Link to={domainPath(d)} className="surface interactive flex h-full flex-col gap-2 rounded-card p-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-control bg-accent-soft font-semibold text-accent-2">{d.code}</span>
                <span className="text-section font-semibold">{d.name}</span>
              </div>
              <p className="line-clamp-3 text-meta text-ink-2">{d.summary}</p>
              <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-1 text-micro text-ink-3">
                <span>{d.lifecycle.length} lifecycle steps</span>
                <span>{d.laser_applications.length} laser applications</span>
                <span>{d.sections.reduce((s, x) => s + x.items.length, 0)} taxonomy entries</span>
                <ArrowRight className="ml-auto size-4 text-accent" aria-hidden />
              </div>
            </Link>
          </li>
        ))}
      </ol>
      <Card title="Laser → Electronics → Semiconductor → Battery → Automation → Advanced Manufacturing">
        <p className="text-meta text-ink-2">Every domain answers the same questions — which applications, which technologies, which machine architecture, which suppliers, what it costs, what can be localized — through the same engines: the Application engine, the Configurator, BOM, Cost, Localization and Projects.</p>
      </Card>
    </div>
  );
}
