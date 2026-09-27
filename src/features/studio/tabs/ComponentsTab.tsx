import { Cpu, Link2, Plug, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../../components/RecordLink';
import { Badge, Button, Card, IconButton, Notice, Table } from '../../../components/ui';
import type { AnyRecord } from '../../../domain';
import { PRODUCT_TYPES, productTypeLabel, type Part, type Slot } from '../../../domain/engineering';
import { checkPair, checkSelection, protocolRequirement, type PairResult } from '../../../services/eng/compatibility';
import { displaySpec, KEY_SPECS, readSpec } from '../../../services/eng/specs';
import type { TabProps } from '../ScenarioPage';
import { CompatBadge } from '../shared';
import { NumInput, SmallSelect, TextInput } from './edit';

export const MACHINE_SLOTS: Slot[] = [
  { role: 'PLC', product_type: 'plc', required: true },
  { role: 'HMI', product_type: 'hmi', required: false },
  { role: 'Industrial PC', product_type: 'ipc', required: false },
  { role: 'Safety controller', product_type: 'safety_plc', required: true },
  { role: 'Door interlock', product_type: 'door_switch', required: false },
  { role: 'Light curtain', product_type: 'light_curtain', required: false },
  { role: 'Servo drive', product_type: 'servo_drive', required: false },
  { role: 'Servo motor', product_type: 'servo_motor', required: false },
  { role: 'Power supply', product_type: 'smps', required: false },
  { role: 'Enclosure', product_type: 'enclosure', required: false },
];

const SYM: Record<string, string> = { Incompatible: '✕', ConditionallyCompatible: '⚠', Unknown: '?', EngineeringCompatible: '✓', Compatible: '✓', ManufacturerRecommended: '★' };

function worst(results: PairResult[]) {
  const order = ['Incompatible', 'ConditionallyCompatible', 'Unknown', 'EngineeringCompatible', 'Compatible', 'ManufacturerRecommended'];
  return results.length ? results.map((r) => r.relationship).sort((a, b) => order.indexOf(a) - order.indexOf(b))[0] : null;
}

export default function ComponentsTab({ eng, sim, set, customer }: TabProps) {
  const [custom, setCustom] = useState<{ station: string; role: string; type: string }>({ station: sim.stations[0]?.key ?? '_machine', role: '', type: 'sensor' });
  const selections = sim.selections ?? [];
  const partOf = (id: string) => eng.byId.get(id) as (Part & AnyRecord) | undefined;
  const groups = [...sim.stations.map((s) => ({ key: s.key, name: s.name, slots: s.slots ?? [] })), { key: '_machine', name: 'Machine level — controls, safety, utilities', slots: MACHINE_SLOTS }];
  const choose = (station: string, role: string, partId: string, qty?: number) =>
    set((s) => {
      const rest = (s.selections ?? []).filter((x) => !(x.station_key === station && x.role === role));
      return { ...s, selections: partId ? [...rest, { station_key: station, role, part_id: partId, ...(qty && qty > 1 ? { quantity: qty } : {}) }] : rest };
    });
  const allSel = useMemo(() => selections.map((x) => partOf(x.part_id)).filter((p): p is Part & AnyRecord => !!p), [selections, eng]); // eslint-disable-line react-hooks/exhaustive-deps
  const pairs = useMemo(() => checkSelection(allSel, eng.ctx), [allSel, eng.ctx]);
  const protos = protocolRequirement(sim.required_protocols ?? [], allSel);
  const neighbours = (station: string, role: string) =>
    selections
      .filter((x) => (x.station_key === station || x.station_key === '_machine' || station === '_machine') && !(x.station_key === station && x.role === role))
      .map((x) => partOf(x.part_id))
      .filter((p): p is Part & AnyRecord => !!p);
  const keyLine = (p: Part & AnyRecord) =>
    (KEY_SPECS[p.product_type] ?? [])
      .slice(0, 3)
      .map((k) => readSpec(p, k, eng.defs))
      .filter(Boolean)
      .map((s) => `${s!.def?.name ?? s!.key} ${displaySpec(s!)}`)
      .join(' · ');
  return (
    <div className="space-y-4">
      {customer && <Notice tone="info">Customer mode shows the technology per function; manufacturer identities and part numbers are hidden.</Notice>}
      {groups.map((g) => {
        const extra = selections.filter((x) => x.station_key === g.key && !g.slots.some((sl) => sl.role === x.role));
        const slots: Slot[] = [...g.slots, ...extra.map((x) => ({ role: x.role, product_type: partOf(x.part_id)?.product_type ?? 'other', required: false }))];
        if (!slots.length) return null;
        return (
          <Card key={g.key} title={g.name} icon={g.key === '_machine' ? ShieldCheck : Cpu}>
            <Table head={['Function', 'Selected component', ...(customer ? [] : ['Key specifications']), 'Qty', 'Fit with the rest', '']} dense>
              {slots.map((sl) => {
                const cur = selections.find((x) => x.station_key === g.key && x.role === sl.role);
                const p = cur ? partOf(cur.part_id) : undefined;
                const nb = neighbours(g.key, sl.role);
                const fit = p ? nb.map((n) => checkPair(p, n, eng.ctx)).filter((r) => r.basis !== 'No rule applies') : [];
                const w = worst(fit);
                const candidates = eng.parts.filter((x) => x.product_type === sl.product_type && x.record_status !== 'Archived');
                return (
                  <tr key={sl.role}>
                    <td>
                      <div className="font-medium">{sl.role}</div>
                      <div className="text-micro text-ink-3">
                        {productTypeLabel(sl.product_type)}
                        {sl.required ? ' · required' : ''}
                      </div>
                    </td>
                    <td className="min-w-56">
                      {customer ? (
                        <span>{p ? `${productTypeLabel(p.product_type)}${(p.technologies ?? []).length ? ` (${(p.technologies ?? []).join(', ')})` : ''}` : 'Not selected'}</span>
                      ) : (
                        <SmallSelect
                          label={`${g.name} — ${sl.role}`}
                          value={cur?.part_id ?? ''}
                          className="w-full"
                          options={[
                            { value: '', label: candidates.length ? '— none —' : `No ${productTypeLabel(sl.product_type)} in the database` },
                            ...candidates.map((c) => {
                              const r = worst(nb.map((n) => checkPair(c, n, eng.ctx)).filter((x) => x.basis !== 'No rule applies'));
                              return { value: c.id, label: `${r ? `${SYM[r]} ` : ''}${c.model_number} — ${c.name}` };
                            }),
                          ]}
                          onChange={(v) => choose(g.key, sl.role, v, cur?.quantity)}
                        />
                      )}
                      {p && !customer && (
                        <Link to={recordPath(p.id)} className="mt-0.5 inline-flex min-h-6 items-center gap-1 text-micro text-accent-2 hover:underline">
                          <Link2 className="size-3" aria-hidden /> {p.data_type === 'DEMO' ? 'DEMO record' : 'Open record'}
                        </Link>
                      )}
                    </td>
                    {!customer && <td className="text-micro text-ink-2">{p ? keyLine(p) || 'No key specifications recorded' : '—'}</td>}
                    <td>{cur ? <NumInput label={`${sl.role} quantity`} min={1} value={cur.quantity ?? 1} onChange={(v) => choose(g.key, sl.role, cur.part_id, Math.max(1, Math.round(v ?? 1)))} width="w-16" /> : '—'}</td>
                    <td>{p ? w ? <CompatBadge t={w} /> : <Badge>No rule applies</Badge> : sl.required ? <Badge tone="warn">Required — not selected</Badge> : <Badge>Optional</Badge>}</td>
                    <td>{cur && !customer && <IconButton size="sm" label={`Remove ${sl.role}`} icon={Trash2} onClick={() => choose(g.key, sl.role, '')} />}</td>
                  </tr>
                );
              })}
            </Table>
          </Card>
        );
      })}
      {!customer && (
        <Card title="Add a component slot" icon={Plus}>
          <div className="flex flex-wrap items-end gap-2">
            <SmallSelect label="Station" value={custom.station} options={[...sim.stations.map((s) => ({ value: s.key, label: s.name })), { value: '_machine', label: 'Machine level' }]} onChange={(v) => setCustom({ ...custom, station: v })} />
            <TextInput label="Function / role" value={custom.role} onChange={(v) => setCustom({ ...custom, role: v })} className="w-48" />
            <SmallSelect label="Product type" value={custom.type} options={Object.keys(PRODUCT_TYPES).map((k) => ({ value: k, label: productTypeLabel(k) }))} onChange={(v) => setCustom({ ...custom, type: v })} />
            <Button
              size="sm"
              disabled={!custom.role.trim() || !eng.parts.some((p) => p.product_type === custom.type)}
              onClick={() => {
                const first = eng.parts.find((p) => p.product_type === custom.type);
                if (first) choose(custom.station, custom.role.trim(), first.id);
              }}
            >
              Add with first {productTypeLabel(custom.type)}
            </Button>
          </div>
        </Card>
      )}
      <Card title="Compatibility of the selection" icon={Plug} description="Recorded relationships (with source) and engineering rules. A rule result is never a manufacturer confirmation.">
        {protos.length > 0 && (
          <ul className="mb-3 space-y-1">
            {protos.map((p) => (
              <li key={p.protocol} className="flex flex-wrap items-center gap-2 text-meta">
                <Badge tone={p.ok ? 'ok' : 'bad'}>{p.ok ? 'OK' : 'Missing'}</Badge> Required {p.protocol}: {p.detail}
              </li>
            ))}
          </ul>
        )}
        {pairs.length ? (
          <Table head={['Pair', 'Result', 'Basis', 'Evidence']} dense>
            {pairs.map((r) => (
              <tr key={`${r.a.id}|${r.b.id}`}>
                <td className="whitespace-nowrap">{customer ? `${productTypeLabel(r.a.product_type)} ↔ ${productTypeLabel(r.b.product_type)}` : `${r.a.model_number} ↔ ${r.b.model_number}`}</td>
                <td>
                  <CompatBadge t={r.relationship} />
                </td>
                <td className="text-micro">{r.basis}</td>
                <td className="text-micro">
                  <ul className="space-y-0.5">
                    {r.recorded.map((x) => (
                      <li key={x.id}>
                        Recorded: {x.relationship}
                        {x.conditions ? ` — ${x.conditions}` : ''}
                        {x.evidence ? ` (${x.evidence})` : ''}
                      </li>
                    ))}
                    {r.checks.map((c) => (
                      <li key={c.rule.id} className={c.status === 'fail' ? 'text-bad' : c.status === 'missing' ? 'text-ink-3' : ''}>
                        {c.status === 'pass' ? '✓' : c.status === 'fail' ? '✕' : '?'} {c.detail}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-meta text-ink-3">No rule or recorded relationship covers the selected components yet.</p>
        )}
        <p className="mt-2 text-micro text-ink-3">Option markers in the pickers: ★ manufacturer recommended · ✓ compatible / rule-based · ⚠ conditional · ? unknown (missing data) · ✕ incompatible — evaluated against the other components of the same station and the machine level.</p>
      </Card>
      <p className="text-micro text-ink-3">{selections.length} component selections.</p>
    </div>
  );
}
