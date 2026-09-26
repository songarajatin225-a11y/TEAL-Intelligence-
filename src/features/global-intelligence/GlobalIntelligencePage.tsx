import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Stat, Tabs } from '../../components/ui';
import { useData } from '../../hooks/useData';
import { EntityListPage } from '../entities/EntityListPage';

const PIPELINE = ['Public source', 'GitHub Action / ingestion script', 'Parser', 'Normalizer', 'Evidence', 'Validation', 'Pull request', 'Human review', 'Merge', 'GitHub Pages'];

/**
 * GLOBAL ENGINEERING INTELLIGENCE (spec §21–§24, §138). The browser never scrapes the web.
 * External data arrives through the reviewed ingestion pipeline (scripts/ingestion/*).
 */
export default function GlobalIntelligencePage() {
  const { records } = useData();
  const nav = useNavigate();
  const [tab, setTab] = useState<'overview' | 'companies' | 'research' | 'patents' | 'market'>('overview');
  const [q, setQ] = useState('50W 1064nm nanosecond laser marking source');
  const ext = records.filter((r) => r.data_type === 'EXTERNAL' || r.data_type === 'PUBLIC');
  const companies = records.filter((r) => r.entity === 'company');
  const products = records.filter((r) => r.entity === 'laser_source' && (r as { kind?: string }).kind === 'product');
  return (
    <div className="space-y-3">
      <PageHeader title="Global Intelligence" subtitle="Companies, products, specifications, applications, sources, evidence, verification — curated from permitted public sources through a reviewed GitHub pipeline. No live scraping from the browser." />
      <Tabs
        label="Global intelligence"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'overview', label: 'Overview & pipeline' },
          { key: 'companies', label: 'Companies', count: companies.length },
          { key: 'research', label: 'Research' },
          { key: 'patents', label: 'Patents' },
          { key: 'market', label: 'Market' },
        ]}
      />
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Stat label="Public / external records" value={ext.length} />
            <Stat label="Companies" value={companies.length} sub="handbook-named, with evidence" />
            <Stat label="Manufacturer laser products" value={products.length} sub="curate via ingestion" />
            <Stat label="Evidence records" value={records.filter((r) => r.entity === 'evidence').length} />
          </div>
          <Card title="Demo — search the global layer (spec §138)">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                nav(`/search?q=${encodeURIComponent(q)}`);
              }}
            >
              <Input aria-label="Query" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
              <Button type="submit" variant="primary">
                Search
              </Button>
            </form>
            <p className="mt-2 text-body text-ink-2">
              Returns TEAL source classes, platforms, applications, handbook sections and handbook-named suppliers with evidence. Then use <Link className="text-accent-2" to="/memory">Find similar</Link>, <Link className="text-accent-2" to="/reuse">What can we reuse?</Link> and <Link className="text-accent-2" to="/missing">What is missing?</Link>. Honest gap: no verified manufacturer datasheet records exist yet — they must be ingested.
            </p>
          </Card>
          <Card title="Controlled ingestion pipeline (spec §22, §101)">
            <ol className="flex flex-wrap items-center gap-1 text-meta">
              {PIPELINE.map((s, i) => (
                <li key={s} className="flex items-center gap-1">
                  <Badge tone={i === 6 || i === 7 ? 'warn' : 'accent'}>{s}</Badge>
                  {i < PIPELINE.length - 1 && <span className="text-ink-3">→</span>}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-body text-ink-2">Scripts: scripts/ingestion/discoverSources, fetchSource, parseProduct, normalizeCompany, normalizeProduct, deduplicate, generateEvidence, validateDataset, generateSearchIndex, generateCatalog. They respect robots.txt, terms of service, copyright, rate limits and authentication boundaries, and never bypass paywalls or CAPTCHA (docs/INGESTION.md).</p>
          </Card>
        </>
      )}
      {tab === 'companies' && <EntityListPage embedded entity="company" title="Global company database" />}
      {(tab === 'research' || tab === 'patents' || tab === 'market') && (
        <EmptyState
          title={`No ${tab} records curated`}
          explain={`${tab === 'research' ? 'Research papers' : tab === 'patents' ? 'Patents' : 'Market figures'} enter only through the ingestion pipeline with source, retrieval date and verification. The OS does not generate ${tab === 'market' ? 'market numbers' : tab}. Add a source manifest under ingestion/sources and open a pull request.`}
          actions={
            <>
              <Button onClick={() => nav('/knowledge')}>Handbook knowledge</Button>
              <Button onClick={() => nav('/search')}>Search</Button>
            </>
          }
        />
      )}
    </div>
  );
}
