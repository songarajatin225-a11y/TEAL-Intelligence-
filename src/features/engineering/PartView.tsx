import clsx from 'clsx';
import { AlertTriangle, BadgeCheck, Cable, FileText, Link2, ListTree, Pencil, Plus, Save, ShieldQuestion, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { toast } from '../../components/toast';
import { Badge, Button, Card, IconButton, KV, Notice, Table } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import type { Part, Simulation, SpecValue } from '../../domain/engineering';
import { disciplineOf, productTypeLabel } from '../../domain/engineering';
import type { Rec } from '../../hooks/useData';
import { repo, ValidationFailure } from '../../repositories';
import { compatibleWith } from '../../services/eng/compatibility';
import { partDuplicates } from '../../services/eng/dataReview';
import { completeness, displaySpec, freshness, normalizeEntry, partConfidence, PRIORITY_LABEL, sourcePriority, validateSpecs } from '../../services/eng/specs';
import { latestPrice, originOf } from '../../services/sim/supply';
import { todayIso } from '../../utils/dates';
import { NumInput, SmallSelect, TextInput } from '../studio/tabs/edit';
import { CompatBadge, useCustomerMode, useEngineering } from '../studio/shared';
import { studioPath } from '../studio/StudioPage';

const LEVEL_TONE = { High: 'ok', Medium: 'info', Low: 'warn', Unverified: 'neutral' } as const;

/** Global engineering database record view (§11, §12, §42, §46, §50, §117, §132). */
export default function PartView({ record }: { record: Rec }) {
  const eng = useEngineering();
  const customer = useCustomerMode();
  const part = record as unknown as Part & AnyRecord;
  const [editing, setEditing] = useState(false);
  const [specs, setSpecs] = useState<SpecValue[]>(part.specs ?? []);
  const today = todayIso();
  const conf = useMemo(() => partConfidence(part, eng.defs, eng.byId, today), [part, eng, today]);
  const issues = validateSpecs({ ...part, specs: editing ? specs : part.specs }, eng.defs);
  const comp = completeness(part);
  const compat = useMemo(() => compatibleWith(part, eng.parts, eng.ctx).slice(0, 24), [part, eng]);
  const usedIn = eng.sims.filter((s) => (s.selections ?? []).some((x) => x.part_id === part.id)) as (Simulation & AnyRecord)[];
  const dups = partDuplicates(eng.parts).filter((d) => d.a.id === part.id || d.b.id === part.id);
  const origin = originOf(part, eng.byId);
  const price = latestPrice(part);
  const applicable = [...eng.defs.values()].filter((d) => d.applies_to.includes(part.product_type) || d.applies_to.includes('*'));
  const sourceOptions = eng.records.filter((r) => r.entity === 'source').map((s) => ({ value: s.id, label: s.name }));

  const save = async () => {
    const { __origin: _o, __dataset: _d, ...clean } = part as Part & AnyRecord & { __origin?: string; __dataset?: string };
    void _o;
    void _d;
    try {
      await repo().workspace.save({ ...clean, specs } as unknown as Record<string, unknown>, `Specifications edited: ${part.model_number}`);
      toast('Specifications saved as a local draft', { tone: 'draft', detail: 'The change appears in the Data Review Center (Changed) until exported.' });
      setEditing(false);
    } catch (e) {
      toast('Not saved', { tone: 'error', detail: e instanceof ValidationFailure ? e.message : String(e) });
    }
  };
  const patch = (i: number, p: Partial<SpecValue>) => setSpecs((s) => s.map((x, j) => (j === i ? { ...x, ...p, extraction_status: 'USER_ENTERED', retrieved_at: x.retrieved_at ?? today } : x)));
  const rows = editing ? specs : part.specs ?? [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Identity" icon={ListTree} className="xl:col-span-2">
          <KV
            items={[
              ['Scope', <Badge key="s" tone={part.scope === 'TEAL' ? 'accent' : 'neutral'}>{part.scope === 'TEAL' ? 'TEAL data (internal overlay)' : part.scope === 'GLOBAL' ? 'Global engineering data' : part.scope}</Badge>],
              ['Manufacturer', part.manufacturer_id ? <Link key="m" to={recordPath(part.manufacturer_id)} className="text-accent-2 hover:underline">{origin.manufacturer}</Link> : part.brand ?? 'Not recorded'],
              ['Model number', part.model_number],
              ['Product type', `${productTypeLabel(part.product_type)} · ${disciplineOf(part.product_type)}`],
              ['Family / series', [part.family, part.series].filter(Boolean).join(' / ') || 'Not recorded'],
              ['Technologies', (part.technologies ?? []).join(', ') || 'Not recorded'],
              ['Processes', (part.processes ?? []).join(', ') || 'Not recorded'],
              ['Lifecycle', `${part.lifecycle_status}${part.discontinued_date ? ` (discontinued ${part.discontinued_date})` : ''}${part.successor_id ? ` → successor ${eng.byId.get(part.successor_id)?.name ?? part.successor_id}` : ''}`],
              ['Record status', part.record_status],
              ['Origin', `${origin.origin}${origin.country ? ` (${origin.country})` : ''}`],
              ...(customer ? [] : [['Latest price', price ? `${price.currency} ${price.price.toLocaleString('en-IN')} (${price.basis}${price.date ? `, ${price.date}` : ''}${price.lead_time_weeks != null ? `, ${price.lead_time_weeks} wk lead time` : ''})` : 'No price recorded'] as [string, string]]),
            ]}
          />
        </Card>
        <Card title={`Confidence: ${conf.level}`} icon={BadgeCheck} description="Derived from source quality, recency, completeness, verification and consistency — never typed in (§50)">
          <Badge tone={LEVEL_TONE[conf.level]}>{conf.level}</Badge>
          <ul className="mt-2 space-y-1 text-meta">
            {conf.factors.map((f) => (
              <li key={f.factor} className="flex items-start gap-1.5">
                <span className={f.ok ? 'text-ok' : 'text-warn'} aria-hidden>
                  {f.ok ? '✓' : '•'}
                </span>
                <span>
                  <strong className="capitalize">{f.factor}</strong>: {f.detail}
                </span>
              </li>
            ))}
          </ul>
          {part.data_type === 'DEMO' && <p className="mt-2 text-micro text-ink-3">DEMO data is Unverified by definition.</p>}
        </Card>
      </div>
      <Card
        title="Specifications"
        icon={ListTree}
        description={`Every value keeps the original as published, its unit, condition and its own source (§12, §13, §46). Key specifications: ${comp.pct == null ? '—' : `${comp.pct} %`}${comp.missing.length ? ` (missing ${comp.missing.map((k) => eng.defs.get(k)?.name ?? k).join(', ')})` : ''}.`}
        actions={
          !customer &&
          (editing ? (
            <>
              <Button size="sm" onClick={() => setSpecs((s) => [...s, { spec: applicable[0]?.key ?? 'weight', extraction_status: 'USER_ENTERED', retrieved_at: today }])}>
                <Plus className="size-3.5" aria-hidden /> Add value
              </Button>
              <Button size="sm" onClick={() => (setSpecs(part.specs ?? []), setEditing(false))}>
                <X className="size-3.5" aria-hidden /> Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={save}>
                <Save className="size-3.5" aria-hidden /> Save
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => (setSpecs(part.specs ?? []), setEditing(true))}>
              <Pencil className="size-3.5" aria-hidden /> Edit specifications
            </Button>
          ))
        }
      >
        {rows.length ? (
          <Table head={['Parameter', 'Value (canonical)', 'As published', 'Condition', 'Source', 'Evidence', 'Status', ...(editing ? [''] : [])]} dense>
            {rows.map((s, i) => {
              const def = eng.defs.get(s.spec);
              const n = normalizeEntry(s, def);
              const src = s.source_id ? eng.byId.get(s.source_id) : undefined;
              const fr = freshness(s, today);
              const conflictKeys = new Set(rows.filter((x, j) => j !== i && x.spec === s.spec && x.source_id !== s.source_id).map((x) => x.spec));
              return (
                <tr key={i} className={clsx(conflictKeys.has(s.spec) && 'bg-warn/5')}>
                  <td>{editing ? <SmallSelect label={`Row ${i + 1} parameter`} value={s.spec} options={[...applicable.map((d) => ({ value: d.key, label: d.name })), ...(applicable.some((d) => d.key === s.spec) ? [] : [{ value: s.spec, label: s.spec }])]} onChange={(v) => patch(i, { spec: v })} className="w-44" /> : <span className="font-medium">{def?.name ?? s.spec}</span>}</td>
                  <td className="num">
                    {editing && def && (def.spec_type === 'number' || def.spec_type === 'range') ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {def.spec_type === 'range' ? (
                          <>
                            <NumInput label="min" value={s.min ?? null} onChange={(v) => patch(i, { min: v })} width="w-20" />–<NumInput label="max" value={s.max ?? null} onChange={(v) => patch(i, { max: v })} width="w-20" />
                          </>
                        ) : (
                          <NumInput label="value" value={s.value ?? null} onChange={(v) => patch(i, { value: v })} width="w-24" />
                        )}
                        <SmallSelect label="unit" value={s.unit ?? ''} options={[{ value: '', label: '—' }, ...(def.allowed_units?.length ? def.allowed_units : def.canonical_unit ? [def.canonical_unit] : []).map((u) => ({ value: u, label: u })), ...(s.unit && !(def.allowed_units ?? [def.canonical_unit]).includes(s.unit) ? [{ value: s.unit, label: s.unit }] : [])]} onChange={(v) => patch(i, { unit: v || undefined })} />
                      </div>
                    ) : editing ? (
                      <TextInput label="text value" value={s.text} onChange={(v) => patch(i, { text: v || undefined })} className="w-40" />
                    ) : (
                      <>
                        {displaySpec(n)}
                        {n.error && <div className="text-micro text-bad">{n.error}</div>}
                      </>
                    )}
                  </td>
                  <td className="text-micro">{editing ? <TextInput label="as published" value={s.original} onChange={(v) => patch(i, { original: v || undefined })} className="w-32" /> : n.original}</td>
                  <td className="text-micro">{editing ? <TextInput label="condition" value={s.condition} onChange={(v) => patch(i, { condition: v || undefined })} className="w-32" /> : s.condition ?? '—'}</td>
                  <td className="text-micro">
                    {editing ? (
                      <SmallSelect label="source" value={s.source_id ?? ''} options={[{ value: '', label: 'No source' }, ...sourceOptions]} onChange={(v) => patch(i, { source_id: v || undefined })} className="w-44" />
                    ) : src ? (
                      <>
                        <Link to={recordPath(src.id)} className="text-accent-2 hover:underline">
                          {src.name}
                        </Link>
                        <div className="text-ink-3">{PRIORITY_LABEL[sourcePriority(src)]}</div>
                      </>
                    ) : (
                      <Badge tone="warn">No source</Badge>
                    )}
                  </td>
                  <td className="text-micro">{editing ? <TextInput label="evidence" value={s.evidence} onChange={(v) => patch(i, { evidence: v || undefined })} className="w-40" /> : s.evidence ?? '—'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {s.verified ? <Badge tone="ok">Verified</Badge> : <Badge>{s.extraction_status ?? 'Unreviewed'}</Badge>}
                      {fr === 'stale' && <Badge tone="warn">Stale</Badge>}
                      {conflictKeys.has(s.spec) && <Badge tone="bad">Conflict</Badge>}
                      {editing && (
                        <label className="inline-flex items-center gap-1 text-micro">
                          <input type="checkbox" checked={!!s.verified} onChange={(e) => patch(i, { verified: e.target.checked, last_verified: e.target.checked ? today : s.last_verified })} /> verified
                        </label>
                      )}
                    </div>
                  </td>
                  {editing && (
                    <td>
                      <IconButton size="sm" label={`Delete ${def?.name ?? s.spec}`} icon={Trash2} onClick={() => setSpecs((x) => x.filter((_, j) => j !== i))} />
                    </td>
                  )}
                </tr>
              );
            })}
          </Table>
        ) : (
          <p className="text-meta text-ink-3">No specifications recorded. Add values from the official datasheet with their source.</p>
        )}
        {issues.length > 0 && (
          <Notice tone="warn">
            <ul className="list-disc pl-5">
              {issues.map((x, i) => (
                <li key={i}>{x.message}</li>
              ))}
            </ul>
          </Notice>
        )}
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Interfaces" icon={Cable} description="Mechanical · optical · electrical · communication · software (§43)">
          <KV
            items={[
              ['Communication', (part.interfaces?.communication ?? []).join(', ') || 'Not recorded'],
              ['Software', (part.interfaces?.software ?? []).join(', ') || 'Not recorded'],
              ['Electrical', part.interfaces?.electrical ? Object.entries(part.interfaces.electrical).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ') : 'Not recorded'],
              ['Optical', part.interfaces?.optical ? Object.entries(part.interfaces.optical).map(([k, v]) => `${k}: ${v}`).join(' · ') : 'Not recorded'],
              ['Mechanical', part.interfaces?.mechanical ? Object.entries(part.interfaces.mechanical).map(([k, v]) => `${k}: ${v}`).join(' · ') : 'Not recorded'],
            ]}
          />
        </Card>
        <Card title="Where used" icon={Link2} description="Equipment scenarios that select this component (one canonical record — §142)">
          {usedIn.length ? (
            <ul className="space-y-1 text-meta">
              {usedIn.map((s) => (
                <li key={s.id}>
                  <Link to={studioPath(s.id)} className="text-accent-2 hover:underline">
                    {s.name}
                  </Link>{' '}
                  — {(s.selections ?? []).filter((x) => x.part_id === part.id).map((x) => x.role).join(', ')}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta text-ink-3">Not used in any equipment scenario.</p>
          )}
          {!customer && (part.certifications ?? []).length > 0 && (
            <div className="mt-3">
              <div className="text-meta font-medium">Certifications (as claimed by the source — never inferred)</div>
              <ul className="text-meta">
                {(part.certifications ?? []).map((c) => (
                  <li key={c.name}>
                    {c.name} {c.verified ? <Badge tone="ok">verified</Badge> : <Badge tone="warn">unverified</Badge>} {c.source_id && <span className="text-micro text-ink-3">({eng.byId.get(c.source_id)?.name ?? c.source_id})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
      <Card title="Compatibility" icon={ShieldQuestion} description="Recorded relationships (sourced) and engineering-rule results. A rule result is never a manufacturer confirmation.">
        {compat.length ? (
          <Table head={['Component', 'Type', 'Result', 'Basis', 'Detail']} dense>
            {compat.map((r) => (
              <tr key={r.b.id}>
                <td>
                  <Link to={recordPath(r.b.id)} className="text-accent-2 hover:underline">
                    {r.b.model_number}
                  </Link>
                </td>
                <td>{productTypeLabel(r.b.product_type)}</td>
                <td>
                  <CompatBadge t={r.relationship} />
                </td>
                <td className="text-micro">{r.basis}</td>
                <td className="text-micro">{[...r.recorded.map((x) => `Recorded: ${x.relationship}${x.conditions ? ` (${x.conditions})` : ''}`), ...r.checks.filter((c) => c.status !== 'pass').map((c) => c.detail)].join('; ') || r.summary}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-meta text-ink-3">No compatibility rule or recorded relationship covers this component yet.</p>
        )}
      </Card>
      {(part.documents ?? []).length > 0 && (
        <Card title="Documents" icon={FileText}>
          <ul className="space-y-1 text-meta">
            {(part.documents ?? []).map((d, i) => (
              <li key={i}>
                <Badge>{d.kind}</Badge> {d.url ? <a href={d.url} target="_blank" rel="noreferrer noopener" className="text-accent-2 hover:underline">{d.title}</a> : d.title} {d.source_id && <span className="text-micro text-ink-3">({eng.byId.get(d.source_id)?.name ?? d.source_id})</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-micro text-ink-3">Documents are referenced, not reproduced — the database stores factual values and where they came from (§53).</p>
        </Card>
      )}
      {dups.length > 0 && (
        <Notice tone="warn">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-4" aria-hidden /> Possible duplicate
          </span>
          <ul className="mt-1 list-disc pl-5">
            {dups.map((d) => {
              const o = d.a.id === part.id ? d.b : d.a;
              return (
                <li key={o.id}>
                  <Link to={recordPath(o.id)} className="text-accent-2 underline">
                    {o.model_number}
                  </Link>{' '}
                  — {d.reasons.join('; ')}. Review in the <Link to="/data-review?queue=Duplicate" className="underline">Data Review Center</Link>; nothing is merged automatically.
                </li>
              );
            })}
          </ul>
        </Notice>
      )}
    </div>
  );
}
