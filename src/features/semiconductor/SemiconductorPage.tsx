import { Link } from 'react-router-dom';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Button, Card, PageHeader } from '../../components/ui';
import type { Product, SemiconductorStep } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';

const STAGES: SemiconductorStep['stage'][] = ['Materials', 'Wafer', 'Front-end fab', 'Test', 'Back-end / ATMP'];

/** SEMICONDUCTOR INTELLIGENCE (spec §54): value chain, laser applications, ATMP focus. */
export default function SemiconductorPage() {
  const steps = useRecords<SemiconductorStep>('semi_step').sort((a, b) => a.order - b.order);
  const products = useRecords<Product>('product').filter((p) => p.industries.includes('ind-semi'));
  const opps = useRecords('opportunity').filter((o) => /semi|atmp/i.test(String((o as { industry?: string }).industry ?? '')));
  const link = (ref: string) => {
    const [p, a] = ref.split('#');
    return `/knowledge/${p}?a=${a}`;
  };
  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow="Semiconductor"
        title="Semiconductor Intelligence"
        subtitle="Where is the opportunity? Raw material → wafer → fab → test → ATMP, with the laser processes the Semiconductor Handbook lists at each step. “Back-end and board-level processes have lower entry barriers than front-end tools; the qualification path runs through OSATs and EMS lines.” (Part XXXII)"
        actions={
          <Link to="/equipment-buyer">
            <Button>Equipment buyer checklist</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-5">
        {STAGES.map((st) => (
          <Card key={st} title={st} className={st === 'Back-end / ATMP' ? 'border-accent' : ''}>
            <ol className="space-y-2">
              {steps
                .filter((s) => s.stage === st)
                .map((s) => (
                  <li key={s.id}>
                    <div className="flex items-center gap-1">
                      <span className="num text-micro text-ink-3">{s.order}</span>
                      <Link to={`/record/${s.id}`} className="font-medium text-accent-2 hover:underline">
                        {s.name}
                      </Link>
                      {s.laser_relevance && <Badge tone="accent">laser</Badge>}
                    </div>
                    {s.laser_relevance && <div className="text-meta text-ink-2">{s.laser_relevance.split(' · ')[0].slice(0, 140)}</div>}
                    <div className="text-micro">
                      {(s.knowledge_refs ?? []).slice(0, 2).map((r) => (
                        <Link key={r} to={link(r)} className="mr-2 text-ink-3 hover:text-accent-2">
                          handbook →
                        </Link>
                      ))}
                    </div>
                  </li>
                ))}
            </ol>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card title="TEAL platforms serving semiconductor">
          <ul className="space-y-1">
            {products.map((p) => (
              <li key={p.id}>
                <RecordLink id={p.id} /> <span className="text-meta text-ink-3">— {p.title}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Semiconductor / ATMP opportunities">
          <ul className="space-y-1">
            {opps.map((o) => (
              <li key={o.id}>
                <RecordLink id={o.id} />
              </li>
            ))}
            {!opps.length && <li className="text-ink-3">None.</li>}
          </ul>
          <Link to="/knowledge/semiconductor/13-parts-xxiv-xxvi-supply-chain-countries-and-india.md?a=part-xxvi-india-semiconductor-ecosystem" className="mt-2 inline-block text-meta text-accent-2">
            India semiconductor ecosystem (handbook Part XXVI) →
          </Link>
        </Card>
      </div>
    </div>
  );
}
