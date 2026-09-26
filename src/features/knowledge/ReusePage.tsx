import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RecordLink } from '../../components/RecordLink';
import { SimilarPanel } from '../../components/ThreadPanels';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData, useEngine } from '../../hooks/useData';
import { matchPlatforms, parseInquiry } from '../../services/inquiry';
import type { Application } from '../../domain/entities';

/** REUSE ENGINE — “What can we reuse?” (spec §43, §140). */
export default function ReusePage() {
  const { records, lexicon } = useData();
  const e = useEngine();
  const [mode, setMode] = useState<'record' | 'text'>('text');
  const [id, setId] = useState('');
  const [text, setText] = useState('');
  const [asked, setAsked] = useState('');
  const pickable = records.filter((r) => ['opportunity', 'configuration', 'product', 'poc', 'project', 'requirement', 'application'].includes(r.entity));
  const probe = useMemo<AnyRecord | null>(() => {
    if (mode === 'record') return (records.find((r) => r.id === id) as AnyRecord | undefined) ?? null;
    return asked ? ({ id: 'x-probe', entity: 'probe', name: asked, description: asked, data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT' } } as unknown as AnyRecord) : null;
  }, [mode, id, asked, records]);
  const platforms = useMemo(() => {
    if (!asked || !lexicon || !e || mode !== 'text') return [];
    const f = parseInquiry(asked, lexicon);
    return matchPlatforms(f, [...e.products.values()], e.sources, new Map(), records.filter((r) => r.entity === 'application') as unknown as Application[]);
  }, [asked, lexicon, e, mode, records]);
  return (
    <div>
      <PageHeader eyebrow="Modules" title="What Can We Reuse?" subtitle="Existing products, modules, POCs, BOMs, suppliers, configurations, lessons — classified Reusable / Potentially reusable / Requires validation / Similar / Not compatible." />
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <Select aria-label="Mode" value={mode} onChange={(ev) => setMode(ev.target.value as 'record' | 'text')} className="w-44">
          <option value="text">Describe a need</option>
          <option value="record">Start from a record</option>
        </Select>
        {mode === 'text' ? (
          <form
            className="flex flex-1 gap-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              setAsked(text.trim());
            }}
          >
            <Input aria-label="Need" value={text} onChange={(ev) => setText(ev.target.value)} placeholder="e.g. inline UV marking of flex circuits with verification" className="max-w-2xl flex-1" />
            <Button type="submit" variant="primary">
              Find reuse
            </Button>
          </form>
        ) : (
          <Select aria-label="Record" value={id} onChange={(ev) => setId(ev.target.value)} className="w-[28rem]">
            <option value="">Select…</option>
            {pickable.map((p) => (
              <option key={p.id} value={p.id}>
                {ENTITY_BY_TYPE[p.entity]?.label}: {p.name}
              </option>
            ))}
          </Select>
        )}
      </div>
      {!probe ? (
        <EmptyState title="Describe the need or pick a record" explain="Reuse is found by structured similarity (family, process, material, source, modules, industry) plus shared engineering terms." />
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_380px]">
          <Card title="Reusable assets">
            <SimilarPanel record={probe} mode="reuse" />
          </Card>
          {platforms.length > 0 && (
            <Card title="Catalogue platforms that fit">
              <ul className="space-y-1.5">
                {platforms.map((m) => (
                  <li key={m.product.id}>
                    <Badge tone="ok">Reusable platform</Badge> <RecordLink id={m.product.id} />
                    <div className="text-meta text-ink-3">{m.why.map((w) => w.d).join('; ')}</div>
                    <div className="text-meta">
                      Standard content: {m.product.standard_content.length ? m.product.standard_content.map((k) => e?.modules.get(k)?.name ?? k).join(', ') : 'none'}
                    </div>
                    <Link className="text-meta text-accent-2" to={`/configurator?product=${m.product.key}&app=${m.appKey}`}>
                      Configure →
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
