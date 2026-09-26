import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { ENTITY_UI, type FieldDef } from '../features/entities/entityUi';
import { useData } from '../hooks/useData';
import { newLocalId, repo, ValidationFailure } from '../repositories';
import { todayIso } from '../utils/dates';
import { Button, Field, Input, Notice, Select, Textarea } from './ui';

type FormValues = Record<string, string | string[] | boolean>;

function toForm(f: FieldDef, v: unknown): string | string[] | boolean {
  if (f.type === 'lines' || f.type === 'tags') return Array.isArray(v) ? (v as string[]).join(f.type === 'tags' ? ', ' : '\n') : '';
  if (f.type === 'refs') return Array.isArray(v) ? (v as string[]) : [];
  if (f.type === 'bool') return !!v;
  if (v && typeof v === 'object' && 'value' in (v as object)) return String((v as { value: unknown }).value ?? '');
  return v == null ? '' : String(v);
}

function fromForm(f: FieldDef, v: unknown, prev: unknown): unknown {
  if (f.type === 'number') {
    const s = String(v ?? '').trim();
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }
  if (f.type === 'lines') return String(v ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  if (f.type === 'tags') return String(v ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  if (f.type === 'refs') return (v as string[]) ?? [];
  if (f.type === 'bool') return !!v;
  void prev;
  return String(v ?? '').trim() || undefined;
}

type Step = 'essentials' | 'links' | 'details' | 'notes';
const STEPS: { key: Step; label: string }[] = [
  { key: 'essentials', label: 'Essentials' },
  { key: 'links', label: 'Links' },
  { key: 'details', label: 'Details' },
  { key: 'notes', label: 'Notes & next action' },
];
/** Long forms (more than 8 fields) are split into steps (ultimate spec §104); short ones stay on one page. */
const MULTI_STEP_MIN = 9;
function stepOf(f: FieldDef, i: number): Step {
  if (f.required || f.type === 'select' || (f.type === 'text' && i < 3)) return 'essentials';
  if (f.type === 'ref' || f.type === 'refs') return 'links';
  if (f.type === 'textarea' || f.type === 'lines') return 'notes';
  return 'details';
}

/**
 * Generic create/edit form. Saves to the LOCAL WORKSPACE only (IndexedDB) and validates against
 * the entity's Zod schema; GitHub master data is never modified from the browser.
 */
export function EntityForm({ entity, record, onSaved, onCancel, preset }: { entity: string; record?: AnyRecord; onSaved: (r: AnyRecord) => void; onCancel: () => void; /** prefilled values for a new record, e.g. { project_id } when created from a room */ preset?: Record<string, unknown> }) {
  const ui = ENTITY_UI[entity];
  const def = ENTITY_BY_TYPE[entity];
  const { records } = useData();
  const [errors, setErrors] = useState<{ path: string; message: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const fields = useMemo(() => ui?.fields ?? [], [ui]);
  const initial = useMemo(() => {
    const base: FormValues = { name: record?.name ?? String(preset?.name ?? ''), description: String(record?.description ?? preset?.description ?? ''), na_action: record?.next_action?.action ?? '', na_due: record?.next_action?.due ?? '', na_owner: record?.next_action?.owner ?? '', owner: String(record?.owner ?? ''), tags: (record?.tags ?? []).join(', ') };
    for (const f of fields) base[f.key] = toForm(f, record ? (record as Record<string, unknown>)[f.key] : (preset?.[f.key] ?? ui?.defaults?.[f.key]));
    return base;
  }, [record, fields, ui, preset]);
  const multi = fields.length >= MULTI_STEP_MIN;
  const stepFor = useMemo(() => new Map(fields.map((f, i) => [f.key, stepOf(f, i)])), [fields]);
  const steps = useMemo(() => STEPS.filter((st) => st.key === 'essentials' || st.key === 'notes' || fields.some((f, i) => stepOf(f, i) === st.key)), [fields]);
  const [step, setStep] = useState<Step>('essentials');
  const idx = steps.findIndex((x) => x.key === step);
  const shown = (st: Step) => !multi || step === st;
  const { register, handleSubmit } = useForm<FormValues>({ defaultValues: initial });

  const optionsFor = (f: FieldDef) => (f.entity === '*' ? records : records.filter((r) => r.entity === f.entity)).slice(0, 2000);

  const submit = handleSubmit(async (v) => {
    setSaving(true);
    setErrors([]);
    try {
      const next: Record<string, unknown> = {
        ...(ui?.defaults ?? {}),
        ...(record ? {} : (preset ?? {})),
        ...(record ?? {}),
        id: record?.id ?? newLocalId(entity),
        entity,
        name: String(v.name).trim(),
        description: String(v.description ?? '').trim() || undefined,
        owner: String(v.owner ?? '').trim() || undefined,
        tags: String(v.tags ?? '').split(',').map((x) => x.trim()).filter(Boolean),
        data_type: record?.data_type ?? 'USER_CREATED',
        provenance: record?.provenance ?? { verification_status: 'DRAFT', note: `Created in the local workspace on ${todayIso()}` },
        created_at: record?.created_at ?? todayIso(),
      };
      for (const f of fields) {
        const prev = (record as Record<string, unknown> | undefined)?.[f.key];
        const val = fromForm(f, v[f.key], prev);
        // Empty input: keep an explicit null (UNKNOWN) where the field is nullable, else omit it.
        if (val === undefined) {
          if (prev === null || (ui?.defaults && ui.defaults[f.key] === null)) next[f.key] = null;
          else delete next[f.key];
        } else next[f.key] = val;
      }
      const na = String(v.na_action ?? '').trim();
      if (na) next.next_action = { action: na, due: String(v.na_due || '') || undefined, owner: String(v.na_owner || '') || undefined };
      else delete next.next_action;
      delete next.__origin;
      delete next.__dataset;
      const saved = await repo().workspace.save(next, `${record ? 'Edited' : 'Created'} ${def?.label ?? entity}`);
      onSaved(saved);
    } catch (e) {
      if (e instanceof ValidationFailure) {
        setErrors(e.issues.length ? e.issues : [{ path: '', message: e.message }]);
        const first = e.issues.map((i) => i.path.split('.')[0]).find((k) => stepFor.has(k));
        setStep(first ? stepFor.get(first)! : 'essentials');
      }
      else setErrors([{ path: '', message: 'The record could not be saved to the local workspace (IndexedDB unavailable or full). Export your workspace and reload.' }]);
    } finally {
      setSaving(false);
    }
  });

  const errFor = (k: string) => errors.find((e) => e.path === k || e.path.startsWith(`${k}.`))?.message;

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Notice tone="draft">Saved as a LOCAL DRAFT in this browser. Permanent repository update requires a GitHub commit (Admin → Change package).</Notice>
      {errors.length > 0 && (
        <div role="alert" className="rounded-md border border-bad/40 bg-bad/5 p-2 text-body text-bad">
          <div className="font-semibold">Not saved — fix these fields:</div>
          <ul className="list-disc pl-5">
            {errors.map((e, i) => (
              <li key={i}>
                {e.path || 'record'}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {multi && (
        <ol className="flex flex-wrap gap-1.5" aria-label="Form steps">
          {steps.map((st, i) => (
            <li key={st.key}>
              <button
                type="button"
                onClick={() => setStep(st.key)}
                aria-current={step === st.key ? 'step' : undefined}
                className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-meta font-medium ring-1 ring-inset', step === st.key ? 'bg-accent-soft text-accent-2 ring-accent/40' : i < idx ? 'text-ink-2 ring-line-strong' : 'text-ink-3 ring-line')}
              >
                <span className="num grid size-4 place-items-center rounded-full bg-ink/[0.08] text-micro">{i < idx ? <Check className="size-3" aria-hidden /> : i + 1}</span>
                {st.label}
              </button>
            </li>
          ))}
        </ol>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2" hidden={!shown('essentials')}>
          <Field label="Name *" htmlFor="f-name" error={errFor('name')}>
            <Input id="f-name" {...register('name')} />
          </Field>
        </div>
        {fields.map((f) => (
          <div key={f.key} hidden={!shown(stepFor.get(f.key)!)} className={f.span === 2 || f.type === 'textarea' || f.type === 'lines' ? 'md:col-span-2' : ''}>
            <Field label={`${f.label}${f.required ? ' *' : ''}`} htmlFor={`f-${f.key}`} hint={f.hint} error={errFor(f.key)}>
              {f.type === 'textarea' || f.type === 'lines' ? (
                <Textarea id={`f-${f.key}`} {...register(f.key)} placeholder={f.type === 'lines' ? 'One per line' : undefined} />
              ) : f.type === 'select' ? (
                <Select id={`f-${f.key}`} {...register(f.key)}>
                  <option value="">—</option>
                  {f.options?.filter(Boolean).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              ) : f.type === 'ref' ? (
                <Select id={`f-${f.key}`} {...register(f.key)}>
                  <option value="">—</option>
                  {optionsFor(f).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              ) : f.type === 'refs' ? (
                <Select id={`f-${f.key}`} multiple className="h-24" {...register(f.key)}>
                  {optionsFor(f).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input id={`f-${f.key}`} type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} step="any" {...register(f.key)} />
              )}
            </Field>
          </div>
        ))}
        {!fields.some((f) => f.key === 'description') && (
          <div className="md:col-span-2" hidden={!shown('notes')}>
            <Field label="Description" htmlFor="f-description">
              <Textarea id="f-description" {...register('description')} />
            </Field>
          </div>
        )}
        <div hidden={!shown('notes')}>
          <Field label="Owner" htmlFor="f-owner">
            <Input id="f-owner" {...register('owner')} />
          </Field>
        </div>
        <div hidden={!shown('notes')}>
          <Field label="Tags" htmlFor="f-tags" hint="Comma separated">
            <Input id="f-tags" {...register('tags')} />
          </Field>
        </div>
        <fieldset hidden={!shown('notes')} className="grid grid-cols-1 gap-3 rounded-md border border-line p-2 md:col-span-2 md:grid-cols-3">
          <legend className="px-1 text-meta font-semibold text-ink-2">Next required action</legend>
          <div className="md:col-span-3">
            <Input aria-label="Next action" placeholder="What must happen next?" {...register('na_action')} />
          </div>
          <Input aria-label="Next action due date" type="date" {...register('na_due')} />
          <Input aria-label="Next action owner" placeholder="Owner" {...register('na_owner')} />
        </fieldset>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save local draft'}
        </Button>
        {multi && idx > 0 && <Button onClick={() => setStep(steps[idx - 1].key)}>Back</Button>}
        {multi && idx < steps.length - 1 && <Button onClick={() => setStep(steps[idx + 1].key)}>Next: {steps[idx + 1].label}</Button>}
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
