import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { costOfOwnership } from '../../calculations/cost';
import { Button, Card, ErrorState, Field, Input, Loading, Notice, PageHeader, Select, Table } from '../../components/ui';
import { CalcValue } from '../../components/why';
import type { Requirement } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { newLocalId, repo } from '../../repositories';
import { stripFrontMatter } from '../../services/knowledgeChunks';
import { fetchText } from '../../utils/paths';

const FILE = 'semiconductor/18-parts-xxxvi-xxxviii-xli-buyers-guide-opportunities-localization-and-co.md';

interface Criterion {
  category: string;
  parameter: string;
  ask: string;
}

export function parseBuyerGuide(md: string): Criterion[] {
  const body = stripFrontMatter(md).body;
  const start = body.indexOf('## Part XXXVI');
  const end = body.indexOf('## Part XXXVII');
  const lines = body.slice(start, end).split('\n').filter((l) => l.startsWith('|') && !l.startsWith('|---'));
  let cat = '';
  return lines.slice(1).map((l) => {
    const c = l.replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
    if (c[0]) cat = c[0];
    return { category: cat, parameter: c[1] ?? '', ask: c[2] ?? '' };
  });
}

/** SEMICONDUCTOR EQUIPMENT BUYER ENGINE (spec §55), from Semiconductor Handbook Part XXXVI. */
export default function EquipmentBuyerPage() {
  const [crit, setCrit] = useState<Criterion[] | null>(null);
  const [err, setErr] = useState(false);
  const opps = useRecords('opportunity');
  const [opp, setOpp] = useState('');
  const nav = useNavigate();
  const [coo, setCoo] = useState<Record<string, string>>({ fixed: '', recurring: '', yield_loss: '', throughput_per_h: '', utilisation: '', yield: '', hours: '' });
  useEffect(() => {
    fetchText(`knowledge/handbooks/${FILE}`)
      .then((md) => setCrit(parseBuyerGuide(md)))
      .catch(() => setErr(true));
  }, []);
  const make = async () => {
    if (!crit || !opp) return;
    const reqs: Requirement[] = crit.map((c, i) => ({
      id: newLocalId('requirement'),
      entity: 'requirement',
      code: `EBR-${String(i + 1).padStart(3, '0')}`,
      name: `${c.category}: ${c.parameter}`,
      level: 'URS',
      category: c.category === 'Safety' ? 'Safety' : c.category === 'Utilities' || c.category === 'Facility' ? 'Utility' : c.category === 'Automation' ? 'Interface' : c.category === 'Commercial' ? 'Commercial' : c.category === 'Quality' ? 'Quality' : 'Performance',
      priority: 'Should',
      source: `Semiconductor Handbook Part XXXVI buyer’s guide — ${c.ask}`,
      opportunity_id: opp,
      status: 'Draft',
      next_action: { action: `Ask the customer: ${c.ask}` },
      data_type: 'INFERRED',
      provenance: { verification_status: 'DRAFT', source_id: 'src-semiconductor-handbook', section: 'Part XXXVI — Semiconductor equipment buyer’s guide' },
    }));
    await repo().workspace.saveMany(reqs as unknown as Record<string, unknown>[], 'Equipment-buyer checklist');
    nav(`/record/${opp}`);
  };
  const v = (k: string) => (coo[k] === '' ? null : Number(coo[k]));
  const c = costOfOwnership({ fixed: v('fixed'), recurring: v('recurring'), yield_loss: v('yield_loss'), throughput_per_h: v('throughput_per_h'), utilisation: v('utilisation'), yield: v('yield'), hours: v('hours') });
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Semiconductor" title="Semiconductor equipment buyer" subtitle="What a fab / OSAT buyer asks of equipment — process, throughput, accuracy, automation (SECS/GEM, GEM300, E84), MES, utilities, footprint, safety (SEMI S2), service, localization. Buy on cost of ownership, not purchase price." />
      <Card title="Buyer’s criteria (Semiconductor Handbook Part XXXVI)" actions={<Link className="text-[12px] text-accent-2" to={`/knowledge/${FILE}?a=part-xxxvi-semiconductor-equipment-buyers-guide`}>Open section →</Link>}>
        {err ? (
          <ErrorState what="The buyer’s guide section could not be loaded." todo="Open it from the Knowledge library." />
        ) : !crit ? (
          <Loading />
        ) : (
          <>
            <Table head={['Category', 'Parameter', 'What to ask / measure']} dense>
              {crit.map((x, i) => (
                <tr key={i}>
                  <td className="font-medium">{x.category}</td>
                  <td>{x.parameter}</td>
                  <td className="text-ink-2">{x.ask}</td>
                </tr>
              ))}
            </Table>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <Field label="Create draft requirements for opportunity" htmlFor="eb-opp">
                <Select id="eb-opp" value={opp} onChange={(e) => setOpp(e.target.value)} className="w-96">
                  <option value="">Select…</option>
                  {opps.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button variant="primary" disabled={!opp} onClick={() => void make()}>
                Create {crit.length} checklist requirements
              </Button>
            </div>
          </>
        )}
      </Card>
      <Card title="Cost of ownership per good unit">
        <Notice tone="info">Enter the customer’s own figures for one period. Nothing is pre-filled.</Notice>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          {(
            [
              ['fixed', 'Fixed cost (INR)'],
              ['recurring', 'Recurring cost (INR)'],
              ['yield_loss', 'Yield-loss cost (INR)'],
              ['throughput_per_h', 'Throughput (units/h)'],
              ['utilisation', 'Utilisation (0–1)'],
              ['yield', 'Yield (0–1)'],
              ['hours', 'Hours in period'],
            ] as const
          ).map(([k, l]) => (
            <Field key={k} label={l} htmlFor={`coo-${k}`}>
              <Input id={`coo-${k}`} type="number" step="any" value={coo[k]} onChange={(e) => setCoo({ ...coo, [k]: e.target.value })} />
            </Field>
          ))}
        </div>
        <div className="mt-2">
          COO: <CalcValue c={c} digits={4} />
        </div>
      </Card>
    </div>
  );
}
