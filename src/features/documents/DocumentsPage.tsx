import clsx from 'clsx';
import { Copy, Download, FileText, Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Markdown } from '../../components/Markdown';
import { toast } from '../../components/toast';
import { Button, Card, EmptyState, Field, Input, Loading, PageHeader, Select } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData, useEngine } from '../../hooks/useData';
import { TEMPLATES, templateById } from '../../services/documents';
import { todayIso } from '../../utils/dates';
import { download } from '../../utils/export';

/** DOCUMENT GENERATION (final master prompt §42): eleven templates, filled from records, exported as Markdown. */
export default function DocumentsPage() {
  const { records, byId, graph, status } = useData();
  const engine = useEngine();
  const [params, setParams] = useSearchParams();
  const tpl = templateById(params.get('t') ?? '') ?? TEMPLATES[0];
  const ids = (params.get('ids') ?? '').split(',').filter((i) => byId.has(i));
  const [filter, setFilter] = useState('');
  const candidates = useMemo(() => records.filter((r) => tpl.entities.includes(r.entity) && (!filter || r.name.toLowerCase().includes(filter.toLowerCase()))).slice(0, 300), [records, tpl, filter]);
  const subjects = ids.map((i) => byId.get(i)!).filter((r) => tpl.entities.includes(r.entity));
  const md = useMemo(() => (subjects.length ? tpl.render(subjects, { records, byId, graph, engine, today: todayIso() }) : ''), [tpl, subjects, records, byId, graph, engine]);

  if (status === 'loading') return <Loading />;
  const pick = (id: string) => setParams({ t: tpl.id, ids: tpl.multi ? [...new Set([...ids, id])].join(',') : id });
  const file = `teal-${tpl.id}-${(subjects[0]?.name ?? 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${todayIso()}.md`;

  return (
    <div className="space-y-5">
      <PageHeader title="Documents" subtitle="PRD, RFQ, technical specification, BOM, supplier comparison, POC plan, DFM checklist, validation plan, MOM, product review and technology assessment — generated from records, with UNKNOWN where nothing is recorded." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <nav aria-label="Templates" className="surface rounded-card p-2">
          <ul className="space-y-0.5">
            {TEMPLATES.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => setParams({ t: t.id })} aria-current={t.id === tpl.id ? 'page' : undefined} className={clsx('w-full rounded-control px-3 py-2 text-left', t.id === tpl.id ? 'bg-accent-soft text-accent-2' : 'hover:bg-ink/5')}>
                  <span className="block text-meta font-medium">{t.title}</span>
                  <span className="block text-micro text-ink-3">from {t.entities.map((e) => ENTITY_BY_TYPE[e]?.label.toLowerCase()).join(' / ')}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-4">
          <Card title={tpl.title} icon={FileText} description={tpl.purpose}>
            <div className="flex flex-wrap items-end gap-3">
              <Field label={`Filter ${tpl.entities.map((e) => ENTITY_BY_TYPE[e]?.plural.toLowerCase()).join(' / ')}`} htmlFor="doc-f">
                <Input id="doc-f" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-60" />
              </Field>
              <Field label={tpl.multi ? 'Add a record' : 'Record'} htmlFor="doc-r">
                <Select id="doc-r" value={tpl.multi ? '' : (ids[0] ?? '')} onChange={(e) => e.target.value && pick(e.target.value)} className="w-80">
                  <option value="">Choose…</option>
                  {candidates.map((r) => (
                    <option key={r.id} value={r.id}>
                      {tpl.entities.length > 1 ? `${ENTITY_BY_TYPE[r.entity]?.label}: ` : ''}
                      {r.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {tpl.multi && subjects.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setParams({ t: tpl.id })}>
                  Clear ({subjects.length})
                </Button>
              )}
            </div>
          </Card>
          {!md ? (
            <EmptyState icon={FileText} title="Choose a record" explain={`The ${tpl.title.toLowerCase()} is generated from ${tpl.multi ? 'the records you add' : 'one record'} and its digital thread.`} compact />
          ) : (
            <Card
              title="Preview"
              actions={
                <>
                  <Button size="sm" onClick={() => download(file, md, 'text/markdown')}>
                    <Download className="size-3.5" aria-hidden /> Markdown
                  </Button>
                  <Button size="sm" onClick={() => navigator.clipboard?.writeText(md).then(() => toast('Copied as Markdown')).catch(() => toast('Could not copy', { tone: 'error' }))}>
                    <Copy className="size-3.5" aria-hidden /> Copy
                  </Button>
                  <Button size="sm" onClick={() => window.print()}>
                    <Printer className="size-3.5" aria-hidden /> Print
                  </Button>
                </>
              }
            >
              <article className="prose-doc text-body" aria-label="Document preview">
                <Markdown source={md} shift={1} />
              </article>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
