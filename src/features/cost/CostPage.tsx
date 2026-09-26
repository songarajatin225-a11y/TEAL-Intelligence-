import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button, Card, Field, Input, Select } from '../../components/ui';
import type { Bom, CostModel } from '../../domain/entities';
import { useData, useRecords } from '../../hooks/useData';
import { newLocalId, repo } from '../../repositories';
import { BOM_COST_ASSUMPTIONS, costMaterialLinesFromBom } from '../../services/bomGen';
import { EntityListPage } from '../entities/EntityListPage';

/** Cost Engine landing: cost models + create from template, BOM or blank. */
export default function CostPage() {
  const { costDefaults } = useData();
  const models = useRecords<CostModel>('cost_model');
  const boms = useRecords<Bom>('bom');
  const nav = useNavigate();
  const [src, setSrc] = useState('');
  const [name, setName] = useState('');
  const d = (costDefaults ?? {}) as { landed?: CostModel['landed']; markup?: CostModel['markup']; teal?: CostModel['teal'] };

  const create = async () => {
    const base = {
      id: newLocalId('cost_model'),
      entity: 'cost_model',
      currency: 'INR',
      qty: 1,
      landed: d.landed ?? { freightPct: 2, dutyPct: 0, landingPct: 1.5, gstPct: 18, siteContPct: 8 },
      markup: d.markup ?? { overheadPct: 14, contingencyPct: 3, profitPct: 18 },
      teal: d.teal,
      scenario: 'Base',
      data_type: 'USER_CREATED',
      provenance: { verification_status: 'DRAFT' },
    };
    let rec: Record<string, unknown>;
    const tpl = models.find((x) => x.id === src);
    const bom = boms.find((x) => x.id === src);
    if (tpl) rec = { ...base, name: name || `Copy of ${tpl.name}`, lines: tpl.lines, landed: tpl.landed, markup: tpl.markup, teal: tpl.teal, assumptions: [...(tpl.assumptions ?? []), `Copied from ${tpl.id}`] };
    else if (bom) rec = { ...base, name: name || `Cost — ${bom.name}`, bom_id: bom.id, product_id: bom.product_id, configuration_id: bom.configuration_id, lines: { material: costMaterialLinesFromBom(bom.lines) }, assumptions: [...BOM_COST_ASSUMPTIONS] };
    else rec = { ...base, name: name || 'New cost model', lines: {} };
    const r = await repo().workspace.save(rec, 'Created cost model');
    nav(`/record/${encodeURIComponent(r.id)}`);
  };

  return (
    <div className="space-y-3">
      <Card title="New cost model">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Start from" htmlFor="cost-src">
            <Select id="cost-src" value={src} onChange={(e) => setSrc(e.target.value)} className="w-80">
              <option value="">Blank</option>
              <optgroup label="Existing cost models / templates">
                {models.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="From BOM">
                {boms.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </optgroup>
            </Select>
          </Field>
          <Field label="Name" htmlFor="cost-name">
            <Input id="cost-name" value={name} onChange={(e) => setName(e.target.value)} className="w-72" />
          </Field>
          <Button variant="primary" onClick={() => void create()}>
            Create
          </Button>
        </div>
      </Card>
      <EntityListPage entity="cost_model" title="Cost Engine" intro="Material → manufacturing → engineering → integration → testing → warranty → service → overhead → contingency → selling price → margin → ROI → payback. Ported from the legacy TEAL Cost Platform; results reproduce it exactly (tests/unit/cost.test.ts)." />
    </div>
  );
}
