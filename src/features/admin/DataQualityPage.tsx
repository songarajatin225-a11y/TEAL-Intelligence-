import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Button, Card, PageHeader, Select, Stat, Table } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { useData } from '../../hooks/useData';
import { reportMarkdown, runDataQuality, type DQIssue } from '../../services/dataQuality';
import { download, stamp } from '../../utils/export';

const SEV_TONE = { error: 'bad', warning: 'warn', info: 'info' } as const;

/**
 * DATA QUALITY (spec §104). The same checks CI runs on master data (scripts/data/dataQuality.ts
 * → reports/data-quality.md), here applied to master + this browser's local drafts.
 */
export default function DataQualityPage() {
  const { records } = useData();
  const [scope, setScope] = useState<'all' | 'local'>('all');
  const [sev, setSev] = useState<'' | DQIssue['severity']>('');
  const [check, setCheck] = useState('');
  const report = useMemo(() => runDataQuality(records as unknown as AnyRecord[]), [records]);
  const localIds = useMemo(() => new Set(records.filter((r) => r.__origin !== 'MASTER').map((r) => r.id)), [records]);
  const issues = report.issues.filter((i) => (scope === 'all' || (i.id && localIds.has(i.id))) && (!sev || i.severity === sev) && (!check || i.check === check));
  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow="Admin"
        title="Data quality"
        subtitle="Missing ids, broken references, unregistered sources, unknown units, duplicates, stale prices and verifications, undated FX, conflicts. Errors fail the CI data-quality gate; warnings are reported."
        actions={
          <Button onClick={() => download(`data-quality-${stamp()}.md`, reportMarkdown(report), 'text/markdown')}>
            <Download className="size-3.5" /> Report (.md)
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Stat label="Records checked" value={report.records} />
        <Stat label="Errors" value={report.errors} tone={report.errors ? 'bad' : 'ok'} />
        <Stat label="Warnings" value={report.warnings} tone={report.warnings ? 'warn' : 'ok'} />
        <Stat label="Info" value={report.issues.length - report.errors - report.warnings} />
        <Stat label="Local records" value={localIds.size} sub="drafts included" />
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        <Card title="By data type">
          <Counts o={report.by_data_type} />
        </Card>
        <Card title="By verification status">
          <Counts o={report.by_verification} />
        </Card>
        <Card title="Checks">
          <Table head={['Check', 'Errors', 'Warnings', 'Info']} dense>
            {Object.entries(report.checks).map(([k, v]) => (
              <tr key={k} className="cursor-pointer hover:bg-panel-2" onClick={() => setCheck(check === k ? '' : k)}>
                <td className={check === k ? 'font-semibold' : ''}>{k}</td>
                <td className="num">{v.errors || '—'}</td>
                <td className="num">{v.warnings || '—'}</td>
                <td className="num">{v.info || '—'}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
      <Card
        title={`Issues (${issues.length})`}
        actions={
          <div className="flex gap-1">
            <Select aria-label="Scope" value={scope} onChange={(e) => setScope(e.target.value as 'all' | 'local')} className="py-0.5 text-[12px]">
              <option value="all">Master + local</option>
              <option value="local">Local drafts only</option>
            </Select>
            <Select aria-label="Severity" value={sev} onChange={(e) => setSev(e.target.value as '' | DQIssue['severity'])} className="py-0.5 text-[12px]">
              <option value="">All severities</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </Select>
            <Select aria-label="Check" value={check} onChange={(e) => setCheck(e.target.value)} className="py-0.5 text-[12px]">
              <option value="">All checks</option>
              {Object.keys(report.checks).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </Select>
          </div>
        }
      >
        {!issues.length ? (
          <p className="text-ink-3">No issues in this selection.</p>
        ) : (
          <div className="max-h-[480px] overflow-y-auto">
            <Table head={['Severity', 'Check', 'Record', 'Message']} dense>
              {issues.slice(0, 500).map((i, n) => (
                <tr key={`${i.id}-${i.check}-${n}`}>
                  <td>
                    <Badge tone={SEV_TONE[i.severity]}>{i.severity}</Badge>
                  </td>
                  <td>{i.check}</td>
                  <td>{i.id ? <RecordLink id={i.id} /> : '—'}</td>
                  <td>{i.message}</td>
                </tr>
              ))}
            </Table>
            {issues.length > 500 && <p className="mt-1 text-[11.5px] text-ink-3">Showing 500 of {issues.length}. Download the report for the full list.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}

function Counts({ o }: { o: Record<string, number> }) {
  const total = Object.values(o).reduce((s, v) => s + v, 0) || 1;
  return (
    <ul className="space-y-1">
      {Object.entries(o)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => (
          <li key={k}>
            <div className="flex justify-between text-[12px]">
              <span>{k}</span>
              <span className="num">{v}</span>
            </div>
            <div className="h-1.5 rounded bg-panel-2">
              <div className="h-1.5 rounded bg-accent" style={{ width: `${(v / total) * 100}%` }} />
            </div>
          </li>
        ))}
    </ul>
  );
}
