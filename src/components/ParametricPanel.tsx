import { SlidersHorizontal } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { hasParams, parametricSearch, parseParams } from '../services/parametric';
import { recordPath } from './RecordLink';
import { Badge, Card } from './ui';

/** Technical-parameter matches for a query (master prompt §26), with every filter that was read. */
export function ParametricPanel({ q }: { q: string }) {
  const { records } = useData();
  const res = useMemo(() => (hasParams(parseParams(q)) ? parametricSearch(q, records) : null), [q, records]);
  if (!res) return null;
  const offers = res.offers.length ? res.offers : res.nearOffers;
  return (
    <Card title="Parameter matches" icon={SlidersHorizontal} description="Read from your query and matched against structured records" edge>
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-meta">
        <span className="text-ink-3">Filters read:</span>
        {res.filters.map((f) => (
          <Badge key={f} tone="accent">
            {f}
          </Badge>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section aria-label="TEAL platforms">
          <h3 className="mb-1 text-meta font-semibold">TEAL platforms {res.offers.length ? '' : res.nearOffers.length ? '— none in the power range; closest options' : ''}</h3>
          {offers.length ? (
            <ul className="space-y-1 text-meta">
              {offers.map((o) => (
                <li key={`${o.product.id}-${o.source.id}`}>
                  <Link to={recordPath(o.product.id)} className="font-medium text-accent-2 hover:underline">
                    {o.product.name}
                  </Link>{' '}
                  <span className="text-ink-3">
                    · {o.source.name} · {o.powers.join(' / ')} W
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta text-ink-3">No TEAL platform offers this combination.</p>
          )}
        </section>
        <section aria-label="Laser source classes">
          <h3 className="mb-1 text-meta font-semibold">Laser source classes</h3>
          {res.sources.length ? (
            <ul className="space-y-1 text-meta">
              {res.sources.map((s) => (
                <li key={s.id}>
                  <Link to={recordPath(s.id)} className="text-accent-2 hover:underline">
                    {s.name}
                  </Link>{' '}
                  <span className="text-ink-3">· {s.wavelength.value} nm</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta text-ink-3">No wavelength or pulse filter in the query.</p>
          )}
        </section>
        <section aria-label="Applications">
          <h3 className="mb-1 text-meta font-semibold">TEAL applications</h3>
          {res.applications.length ? (
            <ul className="space-y-1 text-meta">
              {res.applications.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <Link to={recordPath(a.id)} className="text-accent-2 hover:underline">
                    {a.name}
                  </Link>{' '}
                  <span className="text-ink-3">
                    · {a.process}
                    {a.recommended_power_w != null && ` · ${a.recommended_power_w} W`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta text-ink-3">No application record matches every filter.</p>
          )}
        </section>
      </div>
    </Card>
  );
}
