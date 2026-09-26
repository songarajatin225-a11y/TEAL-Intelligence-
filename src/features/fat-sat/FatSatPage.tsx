import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Field, PageHeader, Select } from '../../components/ui';
import type { Project, Requirement } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { newLocalId, repo } from '../../repositories';
import { generateProtocol, type AcceptanceChecklists } from '../../services/fatSat';
import { EntityListPage } from '../entities/EntityListPage';

export function useChecklists(): AcceptanceChecklists | null {
  const [ck, setCk] = useState<AcceptanceChecklists | null>(null);
  useEffect(() => {
    repo().master.config<AcceptanceChecklists>('acceptance-checklists').then(setCk).catch(() => setCk(null));
  }, []);
  return ck;
}

/** FAT / SAT (spec §73–§74): generate from requirements + handbook checklists, then execute. */
export default function FatSatPage() {
  const projects = useRecords<Project>('project');
  const reqs = useRecords<Requirement>('requirement');
  const ck = useChecklists();
  const nav = useNavigate();
  const [pid, setPid] = useState('');
  const gen = async (phase: 'FAT' | 'SAT') => {
    const p = projects.find((x) => x.id === pid);
    if (!p) return;
    const linked = reqs.filter((r) => r.project_id === p.id || (p.opportunity_id && r.opportunity_id === p.opportunity_id));
    const proto = generateProtocol(phase, p, linked, ck, newLocalId);
    const r = await repo().workspace.save(proto as unknown as Record<string, unknown>, `Generated ${phase} protocol`);
    nav(`/record/${encodeURIComponent(r.id)}`);
  };
  const p = projects.find((x) => x.id === pid);
  const n = p ? reqs.filter((r) => r.project_id === p.id || (p.opportunity_id && r.opportunity_id === p.opportunity_id)).length : 0;
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Validation" title="FAT / SAT" subtitle="Requirement → test → FAT → SAT. Protocols combine every linked requirement with the Automation Handbook checklists (§38.8 FAT, §57.13 SAT readiness, §40.4 SAT template). Results are recorded, never assumed." />
      <Card title="Generate a protocol">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Project" htmlFor="fs-p">
            <Select id="fs-p" value={pid} onChange={(e) => setPid(e.target.value)} className="w-96">
              <option value="">Select…</option>
              {projects.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="primary" disabled={!pid} onClick={() => void gen('FAT')}>
            Generate FAT
          </Button>
          <Button disabled={!pid} onClick={() => void gen('SAT')}>
            Generate SAT
          </Button>
          {p && <span className="text-meta text-ink-3">{n} linked requirement(s) + {ck ? ck.fat.items.length : '—'} FAT checklist items</span>}
        </div>
      </Card>
      <EntityListPage embedded entity="acceptance" title="Protocols" />
    </div>
  );
}
