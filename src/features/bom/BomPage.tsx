import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Field, Select } from '../../components/ui';
import type { Bom, Configuration } from '../../domain/entities';
import { useEngine, useRecords } from '../../hooks/useData';
import { newLocalId, repo } from '../../repositories';
import { bomLinesFromConfig } from '../../services/bomGen';
import { stateFromConfiguration } from '../configurator/ConfiguratorPage';
import { EntityListPage } from '../entities/EntityListPage';

export default function BomPage() {
  const configs = useRecords<Configuration>('configuration');
  const e = useEngine();
  const nav = useNavigate();
  const [cfg, setCfg] = useState('');
  const create = async () => {
    const c = configs.find((x) => x.id === cfg);
    if (!c || !e) return;
    const bom: Bom = { id: newLocalId('bom'), entity: 'bom', name: `BOM — ${c.designation ?? c.name}`, bom_type: 'EBOM', revision: 'P0', product_id: c.product_id, configuration_id: c.id, lines: bomLinesFromConfig(e, stateFromConfiguration(c)), data_type: 'INFERRED', provenance: { verification_status: 'DRAFT', note: 'Generated from configuration; list-price ESTIMATES' }, tags: ['generated'] };
    const r = await repo().workspace.save(bom as unknown as Record<string, unknown>, 'BOM from configuration');
    nav(`/record/${encodeURIComponent(r.id)}`);
  };
  return (
    <div className="space-y-3">
      <Card title="Generate a BOM from a configuration">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Configuration" htmlFor="bom-cfg">
            <Select id="bom-cfg" value={cfg} onChange={(ev) => setCfg(ev.target.value)} className="w-96">
              <option value="">Select…</option>
              {configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="primary" disabled={!cfg} onClick={() => void create()}>
            Generate BOM
          </Button>
        </div>
      </Card>
      <EntityListPage entity="bom" title="BOM Engine" intro="Product → assembly → subassembly → module → component. EBOM, MBOM, service BOM, spare BOM. Every line carries a cost basis (QUOTED / CATALOGUE / ESTIMATE / DEMO / UNKNOWN)." />
    </div>
  );
}
