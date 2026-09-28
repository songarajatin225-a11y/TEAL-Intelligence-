import { useEffect, useState } from 'react';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Button, Card, Input, Select, Stat } from '../../components/ui';
import type { AcceptanceProtocol, AcceptanceTest } from '../../domain/entities';
import type { Rec } from '../../hooks/useData';
import { repo } from '../../repositories';
import { protocolSummary } from '../../services/fatSat';
import { download, stamp, toCsv } from '../../utils/export';

const RESULTS: AcceptanceTest['result'][] = ['NOT RUN', 'PASS', 'PASS WITH DEVIATION', 'FAIL'];

/** FAT/SAT record (spec §73): requirement · test · method · expected · actual · pass/fail · evidence · deviation · action · approval. */
export default function AcceptanceView({ record }: { record: Rec }) {
  const saved = record as unknown as AcceptanceProtocol & Rec;
  const [p, setP] = useState<AcceptanceProtocol>(saved);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setP(saved);
    setDirty(false);
  }, [saved]);
  const s = protocolSummary(p);
  const set = (i: number, k: keyof AcceptanceTest, v: string) => {
    const tests = [...p.tests];
    tests[i] = { ...tests[i], [k]: v || undefined } as AcceptanceTest;
    setP({ ...p, tests });
    setDirty(true);
  };
  const failNoAction = p.tests.filter((t) => (t.result === 'FAIL' || t.result === 'PASS WITH DEVIATION') && !t.action);
  const save = async () => {
    const { __origin, __dataset, ...clean } = p as AcceptanceProtocol & { __origin?: unknown; __dataset?: unknown };
    void __origin;
    void __dataset;
    await repo().workspace.save(clean as unknown as Record<string, unknown>, `Updated ${p.phase} results`);
    setDirty(false);
  };
  const sections = [...new Set(p.tests.map((t) => t.section ?? 'General'))];
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          {p.phase} protocol {dirty && <Badge tone="draft">unsaved</Badge>}
        </span>
      }
      actions={
        <>
          <Button size="sm" onClick={() => download(`teal-${p.phase.toLowerCase()}-${p.id}-${stamp()}.csv`, toCsv(p.tests as unknown as Record<string, unknown>[]), 'text/csv')}>
            Export CSV
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            Print protocol
          </Button>
          <Button size="sm" variant="primary" disabled={!dirty} onClick={() => void save()}>
            Save
          </Button>
        </>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        <Stat label="Tests" value={s.total} />
        <Stat label="Pass" value={s.pass} tone="ok" />
        <Stat label="Pass w/ deviation" value={s.dev} tone={s.dev ? 'warn' : undefined} />
        <Stat label="Fail" value={s.fail} tone={s.fail ? 'bad' : undefined} />
        <Stat label="Not run" value={s.notRun} />
      </div>
      {failNoAction.length > 0 && <p className="mb-2 text-body text-bad">{failNoAction.length} failed/deviating test(s) without an action.</p>}
      {sections.map((sec) => (
        <div key={sec} className="mb-3">
          <div className="mb-1 text-micro font-semibold uppercase text-ink-3">{sec}</div>
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full text-meta">
              <thead>
                <tr className="text-left text-micro uppercase text-ink-3">
                  {['ID', 'Test', 'Method', 'Expected', 'Actual', 'Result', 'Evidence', 'Deviation / action'].map((h) => (
                    <th key={h} className="px-1">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.tests.map((t, i) =>
                  (t.section ?? 'General') !== sec ? null : (
                    <tr key={t.test_id} className="border-t border-line/60 align-top">
                      <td className="num px-1">{t.test_id}</td>
                      <td className="max-w-[260px] px-1">
                        {t.test}
                        {t.requirement_id && (
                          <div className="text-micro">
                            <RecordLink id={t.requirement_id} />
                          </div>
                        )}
                      </td>
                      <td className="px-1 text-ink-2">{t.method}</td>
                      <td className="max-w-[200px] px-1 text-ink-2">{t.expected}</td>
                      <td className="px-1">
                        <Input aria-label={`Actual ${t.test_id}`} value={t.actual ?? ''} onChange={(e) => set(i, 'actual', e.target.value)} className="w-32 py-0.5" />
                      </td>
                      <td className="px-1">
                        <Select aria-label={`Result ${t.test_id}`} value={t.result} onChange={(e) => set(i, 'result', e.target.value)} className="py-0.5">
                          {RESULTS.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-1">
                        <Input aria-label={`Evidence ${t.test_id}`} value={t.evidence ?? ''} placeholder="record / photo / file" onChange={(e) => set(i, 'evidence', e.target.value)} className="w-32 py-0.5" />
                      </td>
                      <td className="px-1">
                        {(t.result === 'FAIL' || t.result === 'PASS WITH DEVIATION') && (
                          <>
                            <Input aria-label={`Deviation ${t.test_id}`} placeholder="deviation" value={t.deviation ?? ''} onChange={(e) => set(i, 'deviation', e.target.value)} className="mb-0.5 w-36 py-0.5" />
                            <Input aria-label={`Action ${t.test_id}`} placeholder="action" value={t.action ?? ''} onChange={(e) => set(i, 'action', e.target.value)} className="w-36 py-0.5" />
                          </>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </Card>
  );
}
