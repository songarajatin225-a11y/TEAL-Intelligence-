import clsx from 'clsx';
import { Radar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/badges';
import { recordPath } from '../../components/RecordLink';
import { toast } from '../../components/toast';
import { Badge, Button, Card, Notice, PageHeader, Select, Textarea } from '../../components/ui';
import { TECH_ADOPTION, TECH_STATUSES, type Technology } from '../../domain/entities';
import { useRecords, type Rec } from '../../hooks/useData';
import { repo, ValidationFailure } from '../../repositories';
import { todayIso } from '../../utils/dates';
import { MATURITY_LANES, MATURITY_RULE, maturityLane } from '../../services/maturity';

type Tech = Technology & Rec;
const RING_FILL = ['#1b7f5a', '#2a6fb0', '#6b7d87', '#00838a', '#b3261e'];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function RadarChart({ techs, onPick, picked }: { techs: Tech[]; onPick: (id: string) => void; picked: string | null }) {
  const domains = [...new Set(techs.map((t) => t.domain))].sort();
  const S = 520;
  const c = S / 2;
  const R = c - 24;
  const ringR = (i: number) => (R * (i + 1)) / TECH_ADOPTION.length;
  const placed = techs
    .filter((t) => t.adoption)
    .map((t) => {
      const ring = TECH_ADOPTION.indexOf(t.adoption!);
      const sector = domains.indexOf(t.domain);
      const h = hash(t.id);
      const a0 = (sector / domains.length) * Math.PI * 2 - Math.PI / 2;
      const a = a0 + ((0.15 + ((h % 70) / 100)) * Math.PI * 2) / domains.length;
      const r0 = ring === 0 ? 0 : ringR(ring - 1);
      const r = r0 + (ringR(ring) - r0) * (0.3 + ((h >> 8) % 40) / 100);
      return { t, x: c + Math.cos(a) * r, y: c + Math.sin(a) * r, ring };
    });
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto w-full max-w-[34rem]" role="group" aria-label={`Technology radar: ${placed.length} classified technologies`}>
      {[...TECH_ADOPTION].reverse().map((ring, ri) => {
        const i = TECH_ADOPTION.length - 1 - ri;
        return <circle key={ring} cx={c} cy={c} r={ringR(i)} fill={RING_FILL[i]} fillOpacity={0.06 + (TECH_ADOPTION.length - i) * 0.015} stroke="var(--c-line-strong)" />;
      })}
      {domains.map((d, i) => {
        const a = (i / domains.length) * Math.PI * 2 - Math.PI / 2;
        const am = a + Math.PI / domains.length;
        return (
          <g key={d}>
            <line x1={c} y1={c} x2={c + Math.cos(a) * R} y2={c + Math.sin(a) * R} stroke="var(--c-line-strong)" />
            <text x={c + Math.cos(am) * (R + 12)} y={c + Math.sin(am) * (R + 12)} fontSize={11} fontWeight={600} fill="var(--c-ink-2)" textAnchor="middle" dominantBaseline="middle">
              {d}
            </text>
          </g>
        );
      })}
      {TECH_ADOPTION.map((ring, i) => (
        <text key={ring} x={c + 4} y={c - ringR(i) + 13} fontSize={10} fill="var(--c-ink-3)">
          {ring}
        </text>
      ))}
      {placed.map(({ t, x, y, ring }) => (
        <g key={t.id} role="button" tabIndex={0} aria-label={`${t.name}: ${t.adoption}`} className="cursor-pointer focus:outline-none" onClick={() => onPick(t.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick(t.id))}>
          <circle cx={x} cy={y} r={picked === t.id ? 9 : 7} fill={RING_FILL[ring]} stroke="white" strokeWidth={1.5} />
          <text x={x} y={y - 11} fontSize={10} fill="var(--c-ink)" textAnchor="middle">
            {t.name.slice(0, 22)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Classify({ t }: { t: Tech }) {
  const [ring, setRing] = useState<string>(t.adoption ?? '');
  const [why, setWhy] = useState(t.adoption_rationale ?? '');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (ring && !why.trim()) return toast('Add the reason for this ring', { tone: 'error', detail: 'A ring without a rationale is not saved.' });
    setBusy(true);
    try {
      await repo().workspace.save({ ...t, adoption: ring || null, adoption_rationale: why.trim() || undefined, adoption_reviewed: ring ? todayIso() : undefined, __origin: undefined, __dataset: undefined } as Record<string, unknown>, ring ? `Radar ring → ${ring}` : 'Radar ring cleared');
    } catch (e) {
      toast('Not saved', { tone: 'error', detail: e instanceof ValidationFailure ? e.message : (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-2">
      <Select aria-label={`Ring for ${t.name}`} value={ring} onChange={(e) => setRing(e.target.value)}>
        <option value="">Not classified</option>
        {TECH_ADOPTION.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </Select>
      <Textarea aria-label={`Why ${t.name} is in this ring`} placeholder="Why this ring? Customers asking, POC results, supplier maturity, cost…" value={why} onChange={(e) => setWhy(e.target.value)} className="min-h-[64px]" />
      <Button size="sm" variant="primary" disabled={busy} onClick={() => void save()}>
        Save ring (local draft)
      </Button>
    </div>
  );
}

/**
 * TECHNOLOGY RADAR (spec §58, ultimate §67). Two separate things, never mixed:
 *  - TEAL radar ring (Adopt · Evaluate · Monitor · Emerging · Avoid) — the team's decision, with a
 *    rationale, managed here as local drafts;
 *  - market maturity (Emerging → Declining) — a claim about the world, set only with evidence.
 */
export default function TechnologyRadarPage() {
  const techs = useRecords<Technology>('technology');
  const nav = useNavigate();
  const [picked, setPicked] = useState<string | null>(null);
  const sel = techs.find((t) => t.id === picked) ?? null;
  const unclassified = useMemo(() => techs.filter((t) => !t.adoption), [techs]);
  const link = (ref: string) => {
    const [p, a] = ref.split('#');
    return `/knowledge/${p}?a=${a}`;
  };
  return (
    <div className="space-y-5">
      <PageHeader title="Technology Radar" subtitle="Where TEAL stands on each technology — adopt, evaluate, monitor, watch as emerging, or avoid — and why." />
      <Notice tone="info">The ring is TEAL’s own decision and needs a written reason. Market maturity (Emerging → Declining) is separate and is set only with linked evidence. Rings are saved as local drafts until committed.</Notice>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card title="Radar" icon={Radar} description={`${techs.length - unclassified.length} of ${techs.length} technologies classified · sectors are domains`}>
          {techs.length - unclassified.length ? (
            <RadarChart techs={techs} onPick={setPicked} picked={picked} />
          ) : (
            <p className="py-10 text-center text-meta text-ink-3">No technology has a ring yet. Pick one on the right and classify it with a reason.</p>
          )}
          <ul className="mt-3 flex flex-wrap gap-2 text-micro" aria-label="Rings">
            {TECH_ADOPTION.map((r, i) => (
              <li key={r} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: RING_FILL[i] }} aria-hidden /> {r} ({techs.filter((t) => t.adoption === r).length})
              </li>
            ))}
          </ul>
        </Card>
        <Card title={sel ? sel.name : 'Classify'} description={sel ? `${sel.domain}${sel.adoption_reviewed ? ` · reviewed ${sel.adoption_reviewed}` : ''}` : 'Choose a technology'}>
          <Select aria-label="Technology" value={picked ?? ''} onChange={(e) => setPicked(e.target.value || null)} className="mb-3">
            <option value="">Choose…</option>
            {techs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.adoption ? `· ${t.adoption}` : ''}
              </option>
            ))}
          </Select>
          {sel && (
            <>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {sel.adoption && <StatusBadge s={sel.adoption} />}
                <Badge>Maturity: {sel.radar_status ?? 'not assessed'}</Badge>
              </div>
              <Classify key={sel.id + (sel.updated_at ?? '')} t={sel} />
              <button type="button" onClick={() => nav(recordPath(sel.id))} className="mt-2 text-meta text-accent-2 hover:underline">
                Open record
              </button>
            </>
          )}
        </Card>
      </div>

      <Card
        title="Maturity by TRL"
        description="Transparent method: the lane follows only from the Technology Readiness Level and its written basis"
        actions={
          <Link to="/compare?entity=technology" className="text-meta text-accent-2 hover:underline">
            Compare technologies
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[...MATURITY_LANES, 'Not assessed' as const].map((lane) => {
            const list = techs.filter((t) => maturityLane(t) === lane);
            return (
              <section key={lane} aria-label={`${lane}: ${list.length}`} className="rounded-control border border-line p-2.5">
                <h3 className="text-meta font-semibold">{lane}</h3>
                <p className="text-micro text-ink-3">{lane === 'Not assessed' ? 'No TRL recorded' : MATURITY_RULE[lane]}</p>
                <ul className="mt-1.5 space-y-0.5 text-meta">
                  {list.slice(0, lane === 'Not assessed' ? 6 : 50).map((t) => (
                    <li key={t.id}>
                      <Link to={recordPath(t.id)} className="inline-flex min-h-6 items-center text-accent-2 hover:underline" title={t.trl_basis ?? undefined}>
                        {t.name}
                      </Link>
                      {t.trl != null && <span className="num text-micro text-ink-3"> · TRL {t.trl}</span>}
                    </li>
                  ))}
                  {lane === 'Not assessed' && list.length > 6 && <li className="text-micro text-ink-3">+{list.length - 6} more</li>}
                  {!list.length && <li className="text-ink-3">—</li>}
                </ul>
              </section>
            );
          })}
        </div>
        <p className="mt-2 text-micro text-ink-3">Set a TRL (1–9) and its basis on the technology record. No lane is assigned without one; Commodity also needs at least three suppliers recorded.</p>
      </Card>

      <Card title="Market maturity (evidence required)">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {TECH_STATUSES.map((s) => {
            const list = techs.filter((t) => t.radar_status === s);
            return (
              <div key={s}>
                <div className="mb-1 text-meta font-semibold">{s}</div>
                <ul className="space-y-0.5 text-meta">
                  {list.map((t) => (
                    <li key={t.id}>
                      <Link className="inline-flex min-h-6 items-center text-accent-2 hover:underline" to={recordPath(t.id)}>
                        {t.name}
                      </Link>{' '}
                      <Badge>{(t.evidence_ids ?? []).length} evidence</Badge>
                    </li>
                  ))}
                  {!list.length && <li className="text-ink-3">—</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title={`Not yet classified (${unclassified.length})`} description="Handbook sections that discuss each topic">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {unclassified.map((t) => (
            <div key={t.id} className={clsx('rounded-control border p-3', picked === t.id ? 'border-accent' : 'border-line')}>
              <div className="flex items-center justify-between gap-2">
                <button type="button" className="font-medium text-accent-2 hover:underline" onClick={() => setPicked(t.id)}>
                  {t.name}
                </button>
                <Badge>{t.domain}</Badge>
              </div>
              <ul className="mt-1 space-y-0.5 text-meta">
                {(t.knowledge_refs ?? []).slice(0, 3).map((r) => (
                  <li key={r}>
                    <Link to={link(r)} className="inline-flex min-h-6 items-center text-ink-2 hover:text-accent-2">
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
