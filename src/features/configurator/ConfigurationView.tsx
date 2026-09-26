import { ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Button, Card, KV, Notice, Unknown } from '../../components/ui';
import { CalcValue } from '../../components/why';
import type { Bom, Configuration, CostModel } from '../../domain/entities';
import { useData, useEngine, type Rec } from '../../hooks/useData';
import { newLocalId, repo } from '../../repositories';
import { BOM_COST_ASSUMPTIONS, bomLinesFromConfig, costMaterialLinesFromBom } from '../../services/bomGen';
import { assetUrl } from '../../utils/paths';
import { CompareTable, stateFromConfiguration } from './ConfiguratorPage';

const inr = (v: number | null | undefined) => (v == null ? null : `₹ ${Math.round(v).toLocaleString('en-IN')}`);

/** Saved configuration: live recomputation vs snapshot, versions, BOM/cost generation, 3D view. */
export default function ConfigurationView({ record }: { record: Rec }) {
  const c = record as unknown as Configuration & Rec;
  const e = useEngine();
  const { records, costDefaults } = useData();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const s = useMemo(() => stateFromConfiguration(c), [c]);
  const live = useMemo(() => (e ? { price: e.price(s), ph: e.physics(s), desig: e.designation(s), comp: e.compatibility(s) } : null), [e, s]);
  const versions = records.filter((r) => r.entity === 'configuration' && ((r as { parent_id?: string }).parent_id === c.id || r.id === c.parent_id));
  const boms = records.filter((r) => r.entity === 'bom' && (r as { configuration_id?: string }).configuration_id === c.id);
  if (!e || !live) return null;

  const generateBom = async () => {
    setBusy(true);
    const bom: Bom = {
      id: newLocalId('bom'),
      entity: 'bom',
      name: `Preliminary BOM — ${c.designation ?? c.name}`,
      bom_type: 'EBOM',
      revision: 'P0',
      product_id: c.product_id,
      configuration_id: c.id,
      lines: bomLinesFromConfig(e, s),
      data_type: 'INFERRED',
      provenance: { verification_status: 'DRAFT', note: 'Generated from configuration; unit costs are list-price ESTIMATES' },
      tags: ['generated'],
    };
    const d = (costDefaults ?? {}) as { landed?: CostModel['landed']; markup?: CostModel['markup']; teal?: CostModel['teal'] };
    const cm: CostModel = {
      id: newLocalId('cost_model'),
      entity: 'cost_model',
      name: `Cost — ${c.designation ?? c.name}`,
      currency: 'INR',
      qty: 1,
      bom_id: bom.id,
      configuration_id: c.id,
      product_id: c.product_id,
      opportunity_id: c.opportunity_id,
      lines: { material: costMaterialLinesFromBom(bom.lines) },
      landed: d.landed ?? { freightPct: 2, dutyPct: 0, landingPct: 1.5, gstPct: 18, siteContPct: 8 },
      markup: d.markup ?? { overheadPct: 14, contingencyPct: 3, profitPct: 18 },
      teal: d.teal,
      scenario: 'Base',
      assumptions: [...BOM_COST_ASSUMPTIONS],
      data_type: 'INFERRED',
      provenance: { verification_status: 'DRAFT', note: 'Generated from configuration BOM' },
      tags: ['generated'],
    };
    await repo().workspace.saveMany([bom, cm] as unknown as Record<string, unknown>[], 'Generated BOM and cost model from configuration');
    setBusy(false);
    nav(`/record/${encodeURIComponent(cm.id)}`);
  };

  const snap = c.snapshot;
  const drift = snap && live.price.value != null && snap.price_estimate_inr != null && Math.abs(snap.price_estimate_inr - live.price.value) > 1;
  return (
    <Card
      title="Configuration"
      actions={
        <>
          <Link to={`/configurator?cfg=${encodeURIComponent(c.id)}`}>
            <Button size="sm">Edit in configurator</Button>
          </Link>
          <a href={assetUrl(`legacy/laser-simulator/index.html#${e.legacyHash(s)}`)} target="_blank" rel="noreferrer">
            <Button size="sm">
              <ExternalLink className="size-3" /> 3D simulator
            </Button>
          </a>
          <Button size="sm" variant="primary" disabled={busy} onClick={() => void generateBom()}>
            Generate BOM + cost
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <KV
          items={[
            ['Designation', <span key="d" className="num">{live.desig}</span>],
            ['Platform', <RecordLink key="p" id={c.product_id} />],
            ['Application', e.product(s)?.applications.find((a) => a.key === c.application_key)?.name ?? c.application_key],
            ['Source / power', `${e.sources.get(c.source_key ?? '')?.name ?? '—'} · ${c.power_w ?? '—'} W`],
            ['Objective', e.lenses.get(c.lens_key ?? '')?.name ?? '—'],
            ['Modules', c.modules.map((m) => e.modules.get(m)?.name ?? m).join(', ') || '—'],
            ['Software / extras', [c.software, ...c.extras].map((m) => e.modules.get(m ?? '')?.name ?? m).join(', ') || '—'],
            ['Version', `v${c.version ?? 1}${c.parent_id ? ` (from ${c.parent_id})` : ''}`],
          ]}
        />
        <KV
          items={[
            ['Price band (ESTIMATE)', live.price.band ? `${inr(live.price.band[0])} – ${inr(live.price.band[1])}` : <Unknown />],
            ['Spot', live.ph ? <CalcValue key="s" c={live.ph.spot} /> : <Unknown />],
            ['Depth of focus', live.ph ? <CalcValue key="d" c={live.ph.dof} /> : <Unknown />],
            ['Regime', live.ph?.regime?.name ?? <Unknown />],
            ['Compatibility', `${live.comp.filter((x) => x.status === 'OK').length} OK · ${live.comp.filter((x) => x.status === 'WARNING').length} warning · ${live.comp.filter((x) => x.status === 'FAIL').length} fail · ${live.comp.filter((x) => x.status === 'UNKNOWN').length} unknown`],
            ['BOMs', boms.length ? boms.map((b) => <RecordLink key={b.id} id={b.id} />) : '—'],
          ]}
        />
      </div>
      {drift && <Notice tone="warn">Catalogue data changed since this configuration was saved: snapshot {inr(snap?.price_estimate_inr)} vs now {inr(live.price.value)}.</Notice>}
      {versions.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-micro font-semibold uppercase text-ink-3">Versions</div>
          {versions.map((v) => (
            <div key={v.id} className="mb-2">
              <Badge>v{(v as { version?: number }).version ?? 1}</Badge> <RecordLink id={v.id} />
              <CompareTable a={s} b={stateFromConfiguration(v as unknown as Configuration)} e={e} bName={v.name} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
