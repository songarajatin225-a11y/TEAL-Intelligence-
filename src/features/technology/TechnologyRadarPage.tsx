import { Link } from 'react-router-dom';
import { Badge, Card, Notice, PageHeader } from '../../components/ui';
import { TECH_STATUSES, type Technology } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';

/** TECHNOLOGY RADAR (spec §58). A status is never assigned without evidence. */
export default function TechnologyRadarPage() {
  const techs = useRecords<Technology>('technology');
  const ring = (s: string | null) => techs.filter((t) => t.radar_status === s);
  const unassessed = techs.filter((t) => !t.radar_status);
  const link = (ref: string) => {
    const [p, a] = ref.split('#');
    return `/knowledge/${p}?a=${a}`;
  };
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Technology" title="Technology Radar" subtitle="Laser, photonics, automation, robotics, vision, semiconductor, AI, digital twin, ultrafast, UV, green, beam shaping, in-process sensing, closed-loop control, MES, Industry 4.0." />
      <Notice tone="info">Radar statuses (Emerging → Declining) are assigned only with linked evidence. Edit a topic, attach evidence records, then set the status. Until then topics are “not assessed” and link to the handbook sections that discuss them.</Notice>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
        {TECH_STATUSES.map((s) => (
          <Card key={s} title={s}>
            <ul className="space-y-0.5">
              {ring(s).map((t) => (
                <li key={t.id}>
                  <Link className="text-accent-2" to={`/record/${t.id}`}>
                    {t.name}
                  </Link>{' '}
                  <Badge>{(t.evidence_ids ?? []).length} evidence</Badge>
                </li>
              ))}
              {!ring(s).length && <li className="text-ink-3">—</li>}
            </ul>
          </Card>
        ))}
      </div>
      <Card title={`Not assessed (${unassessed.length})`}>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {unassessed.map((t) => (
            <div key={t.id} className="rounded border border-line p-2">
              <div className="flex items-center justify-between">
                <Link className="font-medium text-accent-2" to={`/record/${t.id}`}>
                  {t.name}
                </Link>
                <Badge>{t.domain}</Badge>
              </div>
              <ul className="mt-1 space-y-0.5 text-meta">
                {(t.knowledge_refs ?? []).slice(0, 4).map((r) => (
                  <li key={r}>
                    <Link to={link(r)} className="text-ink-2 hover:text-accent-2">
                      {decodeURIComponent(r.split('#')[1] ?? r).replace(/-/g, ' ')}
                    </Link>
                  </li>
                ))}
                {!(t.knowledge_refs ?? []).length && <li className="text-ink-3">No handbook heading mentions this topic.</li>}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
