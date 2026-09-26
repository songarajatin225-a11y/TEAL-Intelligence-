import { useMemo, useState } from 'react';
import { platformBreakEven } from '../../calculations/cost';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Card, Field, Input, PageHeader, Table } from '../../components/ui';
import { CalcValue } from '../../components/why';
import type { Configuration, Product } from '../../domain/entities';
import { useEngine, useRecords } from '../../hooks/useData';

/** PRODUCT PLATFORMIZATION (spec §57): custom machine → standard platform. */
export default function PlatformizationPage() {
  const products = useRecords<Product>('product');
  const configs = useRecords<Configuration>('configuration');
  const e = useEngine();
  const [inv, setInv] = useState('');
  const [save, setSave] = useState('');
  const usage = useMemo(() => {
    const m = new Map<string, { std: string[]; configured: string[] }>();
    for (const p of products) for (const k of p.standard_content) m.set(k, { std: [...(m.get(k)?.std ?? []), p.name], configured: m.get(k)?.configured ?? [] });
    for (const c of configs) for (const k of [...c.modules, ...c.extras]) m.set(k, { std: m.get(k)?.std ?? [], configured: [...(m.get(k)?.configured ?? []), c.name] });
    return [...m.entries()].sort((a, b) => b[1].std.length + b[1].configured.length - (a[1].std.length + a[1].configured.length));
  }, [products, configs]);
  const byDelivery = useMemo(() => {
    const m = new Map<string, Product[]>();
    for (const p of products) m.set(p.delivery, [...(m.get(p.delivery) ?? []), p]);
    return [...m.entries()];
  }, [products]);
  const sources = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of products) for (const s of p.source_keys) m.set(s, [...(m.get(s) ?? []), p.name]);
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [products]);
  const be = platformBreakEven({ investment: inv ? Number(inv) : null, saving_per_machine: save ? Number(save) : null });
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Products" title="Product platformization" subtitle="Common modules, standard interfaces, reusable software, reusable BOM, common suppliers, standard validation and documentation — from the catalogue and every saved configuration. “The product manager’s job is to make the second machine cheaper and faster than the first.” (Automation Handbook Part 59)" />
      <div className="grid gap-3 xl:grid-cols-2">
        <Card title="Module commonality">
          <Table head={['Module', 'Standard on', 'Configured in', 'Class']} dense>
            {usage.map(([k, u]) => (
              <tr key={k}>
                <td>
                  <RecordLink id={`mod-${k}`} />
                </td>
                <td className="num">{u.std.length}</td>
                <td className="num">{u.configured.length}</td>
                <td>{u.std.length >= 2 ? <Badge tone="ok">platform module</Badge> : u.std.length + u.configured.length >= 2 ? <Badge tone="accent">candidate</Badge> : <Badge>special</Badge>}</td>
              </tr>
            ))}
          </Table>
          <p className="mt-1 text-[11.5px] text-ink-3">Rule: standard content on ≥2 platforms = platform module; used ≥2 times overall = candidate for standardisation.</p>
        </Card>
        <div className="space-y-3">
          <Card title="Architecture families (beam delivery)">
            <ul className="space-y-1">
              {byDelivery.map(([d, ps]) => (
                <li key={d}>
                  <Badge>{d}</Badge> {ps.map((p) => p.name).join(', ')}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Common laser source classes">
            <ul className="space-y-1">
              {sources.map(([s, ps]) => (
                <li key={s}>
                  <RecordLink id={`las-${s}`} /> <span className="text-[11.5px] text-ink-3">on {ps.length} platforms</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-[11.5px] text-ink-3">LaserSuite software editions ({[...(e?.modules.values() ?? [])].filter((m) => m.kind === 'software').length}) are the reusable software layer across all platforms.</p>
          </Card>
          <Card title="Platform break-even (Handbook C8)">
            <div className="flex flex-wrap gap-2">
              <Field label="Platform investment (INR)" htmlFor="pi">
                <Input id="pi" type="number" value={inv} onChange={(ev) => setInv(ev.target.value)} />
              </Field>
              <Field label="Saving per machine (INR)" htmlFor="ps">
                <Input id="ps" type="number" value={save} onChange={(ev) => setSave(ev.target.value)} />
              </Field>
            </div>
            <div className="mt-2">
              Break-even: <CalcValue c={be} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
