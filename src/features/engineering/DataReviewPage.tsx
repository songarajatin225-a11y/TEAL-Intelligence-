import { Archive, Check, GitMerge, Pencil, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { toast } from '../../components/toast';
import { TrustBadge } from '../../components/TrustBadge';
import { Badge, Button, Card, EmptyState, Loading, Modal, Notice, PageHeader, Table, Tabs } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import type { DataConflict, Part } from '../../domain/engineering';
import { newLocalId, repo, ValidationFailure } from '../../repositories';
import { detectConflicts, diffSpecs, REVIEW_QUEUES, reviewQueues, type ReviewItem, type ReviewQueue } from '../../services/eng/dataReview';
import { todayIso } from '../../utils/dates';
import { useEngineering } from '../studio/shared';

const QUEUE_HELP: Record<ReviewQueue, string> = {
  New: 'Records created, imported or extracted that nobody has reviewed yet',
  Changed: 'Local edits of GitHub records — check the old → new values before export',
  Conflicting: 'Two sources disagree on a value. Resolve by choosing — the other value is kept as history',
  Duplicate: 'Possible duplicates. Never merged automatically — choose which record survives',
  Missing: 'Less than half of the key specifications are recorded',
  Stale: 'Sources not verified in 12 months, or past their review date',
  Unverified: 'No verified value and not approved',
};

const strip = (r: AnyRecord) => {
  const { __origin: _o, __dataset: _d, ...rest } = r as AnyRecord & { __origin?: string; __dataset?: string };
  void _o;
  void _d;
  return rest as Record<string, unknown>;
};

/** DATA REVIEW CENTER (industrial intelligence master prompt §47, §111–§113). */
export default function DataReviewPage() {
  const eng = useEngineering();
  const [params, setParams] = useSearchParams();
  const queue = (params.get('queue') as ReviewQueue) ?? 'New';
  const today = todayIso();
  const q = useMemo(() => reviewQueues(eng.records, eng.defs, today), [eng, today]);
  const [merge, setMerge] = useState<ReviewItem | null>(null);
  const archived = eng.parts.filter((p) => p.record_status === 'Archived');
  if (eng.status === 'loading') return <Loading />;
  const save = async (rec: Record<string, unknown>, summary: string) => {
    try {
      await repo().workspace.save(rec, summary);
      toast(summary, { tone: 'draft', detail: 'Local draft — export a change package to make it permanent.' });
    } catch (e) {
      toast('Not saved', { tone: 'error', detail: e instanceof ValidationFailure ? e.message : String(e) });
    }
  };
  const setStatus = (r: AnyRecord, status: Part['record_status'], note?: string) => save({ ...strip(r), record_status: status, ...(note ? { notes: [String(r.notes ?? ''), note].filter(Boolean).join('\n') } : {}) }, `${r.name}: ${status}`);
  const items = q[queue] ?? [];
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Data governance" title="Data Review Center" subtitle="New, changed, conflicting, duplicate, missing, stale and unverified engineering data — approve, reject, merge, edit or archive. Nothing changes without a person deciding." />
      <Tabs<ReviewQueue> label="Review queues" value={queue} onChange={(k) => setParams((p) => (p.set('queue', k), p), { replace: true })} tabs={REVIEW_QUEUES.map((k) => ({ key: k, label: k, count: q[k].length }))} />
      <p className="text-meta text-ink-3">{QUEUE_HELP[queue]}</p>
      {queue === 'Conflicting' ? (
        <Conflicts eng={eng} save={save} />
      ) : queue === 'Changed' ? (
        <Changed items={items} eng={eng} />
      ) : items.length ? (
        <Card>
          <Table head={['Record', 'Reason', 'Status', 'Trust', 'Actions']} dense>
            {items.map((it, i) => (
              <tr key={`${it.record.id}-${i}`}>
                <td>
                  <Link to={recordPath(it.record.id)} className="font-medium text-accent-2 hover:underline">
                    {it.record.name}
                  </Link>
                  {it.related && (
                    <div className="text-micro">
                      and{' '}
                      <Link to={recordPath(it.related.id)} className="text-accent-2 hover:underline">
                        {it.related.name}
                      </Link>
                    </div>
                  )}
                </td>
                <td className="text-micro">{it.reason}</td>
                <td>
                  <Badge>{String(it.record.record_status ?? it.record.status ?? '—')}</Badge>
                </td>
                <td>
                  <TrustBadge record={it.record} />
                </td>
                <td className="whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {queue === 'Duplicate' ? (
                      <Button size="sm" onClick={() => setMerge(it)}>
                        <GitMerge className="size-3.5" aria-hidden /> Merge…
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => setStatus(it.record, 'Approved', `Approved in Data Review ${today}`)} disabled={it.record.data_type === 'DEMO'} title={it.record.data_type === 'DEMO' ? 'DEMO data cannot be approved as engineering data' : undefined}>
                          <Check className="size-3.5" aria-hidden /> Approve
                        </Button>
                        <Button size="sm" onClick={() => setStatus(it.record, 'Archived', `Rejected in Data Review ${today}`)}>
                          <X className="size-3.5" aria-hidden /> Reject
                        </Button>
                      </>
                    )}
                    <Link to={`${recordPath(it.record.id)}?edit=1`} className="inline-flex min-h-8 items-center gap-1 rounded-control px-2 text-meta text-accent-2 hover:bg-accent-soft">
                      <Pencil className="size-3.5" aria-hidden /> Edit
                    </Link>
                    <Button size="sm" onClick={() => setStatus(it.record, 'Archived', `Archived in Data Review ${today}`)}>
                      <Archive className="size-3.5" aria-hidden /> Archive
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState compact title={`Nothing in “${queue}”`} explain="This queue is empty." />
      )}
      {archived.length > 0 && (
        <Card title="Archived" description="Archived records stay in the database with their history; restore brings them back to review">
          <ul className="space-y-1 text-meta">
            {archived.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2">
                <Link to={recordPath(p.id)} className="text-accent-2 hover:underline">
                  {p.name}
                </Link>
                {p.successor_id && <span className="text-micro text-ink-3">merged into {eng.byId.get(p.successor_id)?.name ?? p.successor_id}</span>}
                <Button size="sm" onClick={() => setStatus(p, 'Reviewed', `Restored in Data Review ${today}`)}>
                  <RotateCcw className="size-3.5" aria-hidden /> Restore
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Modal
        open={!!merge}
        onClose={() => setMerge(null)}
        title="Merge possible duplicates"
        footer={<Button onClick={() => setMerge(null)}>Cancel</Button>}
      >
        {merge?.related && (
          <div className="space-y-3 text-body">
            <p>{merge.reason}</p>
            <p className="text-meta text-ink-2">Choose the record that survives. The other is archived with a pointer to the survivor — its values stay available as history; nothing is deleted.</p>
            <div className="flex flex-wrap gap-2">
              {[merge.record, merge.related].map((keep) => {
                const drop = keep.id === merge.record.id ? merge.related! : merge.record;
                return (
                  <Button
                    key={keep.id}
                    variant="primary"
                    onClick={async () => {
                      await save({ ...strip(drop), record_status: 'Archived', successor_id: keep.id, notes: [String(drop.notes ?? ''), `Merged into ${keep.id} on ${today}`].filter(Boolean).join('\n') }, `Merged ${drop.name} into ${keep.name}`);
                      setMerge(null);
                    }}
                  >
                    Keep {keep.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Conflicts({ eng, save }: { eng: ReturnType<typeof useEngineering>; save: (r: Record<string, unknown>, s: string) => Promise<void> }) {
  const cs = detectConflicts(eng.records, eng.defs).filter((c) => !c.record || c.record.conflict_status === 'Open');
  const today = todayIso();
  if (!cs.length) return <EmptyState compact icon={ShieldAlert} title="No open conflicts" explain="No two sources disagree on a recorded value." />;
  const resolve = async (c: (typeof cs)[number], pick: number | 'dismiss') => {
    const chosen = pick === 'dismiss' ? null : c.values[pick];
    const part = c.part;
    // 1. the conflict record carries the decision (created when the conflict was only detected)
    const rec: DataConflict & Record<string, unknown> = c.record
      ? { ...(strip(c.record) as DataConflict & Record<string, unknown>) }
      : ({ id: newLocalId('data_conflict'), entity: 'data_conflict', name: `${part.model_number}: ${eng.defs.get(c.parameter)?.name ?? c.parameter}`, part_id: part.id, parameter: c.parameter, source_a_id: c.values[0]?.source_id, value_a: c.values[0]?.value ?? '', source_b_id: c.values[1]?.source_id, value_b: c.values[1]?.value ?? '', conflict_status: 'Open', data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT' } } as unknown as DataConflict & Record<string, unknown>);
    await save({ ...rec, conflict_status: chosen ? 'Resolved' : 'Dismissed', reviewer: 'Data Review Center', resolution: chosen ? `Accepted ${chosen.value} from ${eng.byId.get(chosen.source_id ?? '')?.name ?? 'unsourced'} on ${today}; the other value is kept as history` : `Dismissed on ${today}`, ...(chosen?.source_id ? { resolution_source_id: chosen.source_id } : {}) }, `Conflict ${chosen ? 'resolved' : 'dismissed'}: ${part.model_number} ${c.parameter}`);
    // 2. the accepted value is marked verified on the part — no value is deleted or overwritten
    if (chosen && part.data_type !== 'DEMO') {
      let marked = false;
      const specs = part.specs.map((s) => {
        if (!marked && s.spec === c.parameter && s.source_id === chosen.source_id) {
          marked = true;
          return { ...s, verified: true, last_verified: today, extraction_status: 'REVIEWED' as const };
        }
        return s;
      });
      await save({ ...strip(part), specs }, `Accepted value marked verified: ${part.model_number}`);
    }
  };
  return (
    <Card>
      <Notice tone="info">Resolving records the decision in a data-conflict record. For real data the accepted value is marked verified; the other value stays in the record as history. DEMO values are never marked verified.</Notice>
      <Table head={['Record', 'Parameter', 'Values by source', 'Resolve']} dense>
        {cs.map((c, i) => (
          <tr key={`${c.part.id}-${c.parameter}-${i}`}>
            <td>
              <Link to={recordPath(c.part.id)} className="text-accent-2 hover:underline">
                {c.part.model_number}
              </Link>
            </td>
            <td>{eng.defs.get(c.parameter)?.name ?? c.parameter}</td>
            <td className="text-micro">
              <ul>
                {c.values.map((v, k) => (
                  <li key={k}>
                    <strong>{v.value}</strong> — {eng.byId.get(v.source_id ?? '')?.name ?? 'no source'}
                  </li>
                ))}
              </ul>
            </td>
            <td>
              <div className="flex flex-wrap gap-1">
                {c.values.map((v, k) => (
                  <Button key={k} size="sm" onClick={() => resolve(c, k)}>
                    Accept {v.value}
                  </Button>
                ))}
                <Button size="sm" onClick={() => resolve(c, 'dismiss')}>
                  Dismiss
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function Changed({ items, eng }: { items: ReviewItem[]; eng: ReturnType<typeof useEngineering> }) {
  const [masters, setMasters] = useState<Record<string, AnyRecord | undefined>>({});
  useEffect(() => {
    let off = false;
    void Promise.all(items.map(async (it) => [it.record.id, await repo().master.get(it.record.id)] as const)).then((xs) => !off && setMasters(Object.fromEntries(xs)));
    return () => {
      off = true;
    };
  }, [items]);
  if (!items.length) return <EmptyState compact title="No changed records" explain="Local edits of GitHub engineering records appear here with their old → new values (§111)." />;
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const m = masters[it.record.id] as (Part & AnyRecord) | undefined;
        const d = m ? diffSpecs(m, it.record as unknown as Part, eng.defs) : [];
        return (
          <Card key={it.record.id} title={it.record.name} description="Data change event — review before the change package is exported">
            {m ? (
              d.length ? (
                <Table head={['Parameter', 'Old value (GitHub)', 'New value (this browser)']} dense>
                  {d.map((x) => (
                    <tr key={x.spec}>
                      <td>{x.spec}</td>
                      <td className="num">{x.before}</td>
                      <td className="num font-semibold">{x.after}</td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <p className="text-meta text-ink-3">No specification changed (other fields differ).</p>
              )
            ) : (
              <p className="text-meta text-ink-3">Loading the GitHub version…</p>
            )}
            <div className="mt-2 flex gap-2">
              <Link to={recordPath(it.record.id)} className="text-meta text-accent-2 hover:underline">
                Open record
              </Link>
              <Button size="sm" onClick={() => repo().workspace.discard(it.record.id)}>
                <RotateCcw className="size-3.5" aria-hidden /> Discard the change
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
