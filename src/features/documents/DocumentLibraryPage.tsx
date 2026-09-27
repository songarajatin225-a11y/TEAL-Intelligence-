import { FileText } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Badge, Card, EmptyState, Loading, Notice, PageHeader, Table, Tabs } from '../../components/ui';
import type { Part } from '../../domain/engineering';
import { useData } from '../../hooks/useData';

const KINDS = ['All', 'Datasheet', 'Manual', 'Drawing', 'CAD', 'Application Note', 'Test Report', 'Specification', 'Product Page'] as const;
type Kind = (typeof KINDS)[number];

/**
 * TECHNICAL DOCUMENTS (industrial intelligence master prompt §4 DOCUMENTS, §53): every document the
 * database references — component datasheets, manuals, drawings, CAD, application notes, test reports,
 * specifications — plus the source registry. Documents are referenced, never reproduced.
 */
export default function DocumentLibraryPage() {
  const { records, byId, status } = useData();
  const [params, setParams] = useSearchParams();
  const kind = (params.get('kind') as Kind) ?? 'All';
  const docs = useMemo(
    () => [
      ...records
        .filter((r) => r.entity === 'part')
        .flatMap((r) => ((r as unknown as Part).documents ?? []).map((d) => ({ kind: d.kind as string, title: d.title, url: d.url, source: d.source_id, about: r.id, aboutName: r.name, data_type: r.data_type }))),
      ...records.filter((r) => r.entity === 'source' && r.kind === 'datasheet').map((s) => ({ kind: /application note|app note/i.test(s.name) ? 'Application Note' : 'Datasheet', title: s.name, url: s.url as string | undefined, source: s.id, about: s.id, aboutName: 'Source registry', data_type: s.data_type })),
      ...records.filter((r) => r.entity === 'verification' && r.evidence).map((v) => ({ kind: 'Test Report', title: `${v.name} — evidence`, url: undefined, source: undefined, about: v.id, aboutName: v.name, data_type: v.data_type })),
    ],
    [records],
  );
  if (status === 'loading') return <Loading />;
  const shown = kind === 'All' ? docs : docs.filter((d) => d.kind === kind);
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Documents" title="Technical Documents" subtitle="Datasheets, manuals, drawings, CAD, application notes, test reports and specifications referenced by the engineering database. Documents are referenced with their source — never reproduced." />
      <Tabs<Kind> label="Document kind" value={kind} onChange={(k) => setParams((p) => (k === 'All' ? p.delete('kind') : p.set('kind', k), p), { replace: true })} tabs={KINDS.map((k) => ({ key: k, label: k, count: k === 'All' ? docs.length : docs.filter((d) => d.kind === k).length }))} />
      {shown.length ? (
        <Card title={kind === 'All' ? 'All documents' : kind} icon={FileText}>
          <Table head={['Document', 'Kind', 'About', 'Source', 'Data']} dense>
            {shown.map((d, i) => (
              <tr key={i}>
                <td>{d.url ? <a href={d.url} target="_blank" rel="noreferrer noopener" className="text-accent-2 hover:underline">{d.title}</a> : d.title}</td>
                <td>
                  <Badge>{d.kind}</Badge>
                </td>
                <td>
                  <Link to={recordPath(d.about)} className="text-accent-2 hover:underline">
                    {d.aboutName}
                  </Link>
                </td>
                <td className="text-micro">{d.source ? byId.get(d.source)?.name ?? d.source : '—'}</td>
                <td>{d.data_type === 'DEMO' ? <Badge tone="demo">DEMO</Badge> : <Badge>{d.data_type}</Badge>}</td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState icon={FileText} title={`No ${kind === 'All' ? 'documents' : kind.toLowerCase() + 's'} referenced yet`} explain="Add document references on a component record (Documents), or register the source in the source registry." />
      )}
      <Notice tone="info">Generated engineering documents (PRD, specification, BOM, POC plan, validation plan, reports) are under <Link to="/documents" className="underline">Document Templates</Link> and the Studio’s Report tab.</Notice>
    </div>
  );
}
