import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { DataTypeBadge, VerificationBadge } from '../../components/badges';
import { Markdown } from '../../components/Markdown';
import { Badge, Card, EmptyState, ErrorState, Loading, PageHeader } from '../../components/ui';
import { stripFrontMatter } from '../../services/knowledgeChunks';
import { fetchJson, fetchText } from '../../utils/paths';

interface BookIndex {
  handbook: string;
  title: string;
  role: string;
  parts: { file: string; title: string; chars: number }[];
}

const BOOKS = ['semiconductor', 'laser', 'automation'] as const;

function Library({ only }: { only?: string }) {
  const [books, setBooks] = useState<BookIndex[] | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    Promise.all(BOOKS.map((b) => fetchJson<BookIndex>(`knowledge/handbooks/${b}/_index.json`)))
      .then(setBooks)
      .catch(() => setErr(true));
  }, []);
  if (err) return <ErrorState what="The handbook index could not be loaded." why="knowledge/handbooks/*/_index.json is missing from the deployment." todo="Rebuild with npm run build (the publish step copies /knowledge)." />;
  if (!books) return <Loading />;
  return (
    <div>
      <PageHeader eyebrow="Knowledge" title="Engineering Knowledge" subtitle="The three foundational TEAL handbooks, converted to version-controlled Markdown. Text is the handbooks’ own wording; figures are not transcribed; equations are linearised. Search them from the top bar." />
      <div className={only ? 'grid gap-3' : 'grid gap-3 xl:grid-cols-3'}>
        {books.filter((b) => !only || b.handbook === only).map((b) => (
          <Card key={b.handbook} title={b.title} actions={<Badge tone="accent">{b.role}</Badge>}>
            <div className="mb-2 flex gap-1">
              <DataTypeBadge t="TEAL_INTERNAL" />
              <VerificationBadge v="SOURCE_DOCUMENTED" />
            </div>
            <ol className="max-h-[60vh] space-y-0.5 overflow-y-auto">
              {b.parts.map((p) => (
                <li key={p.file}>
                  <Link className="text-accent-2 hover:underline" to={`/knowledge/${b.handbook}/${p.file}`}>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Reader({ path }: { path: string }) {
  const [params] = useSearchParams();
  const anchor = params.get('a');
  const hl = params.get('q') ?? '';
  const [md, setMd] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [book, file] = path.split('/');
  const [index, setIndex] = useState<BookIndex | null>(null);
  useEffect(() => {
    setMd(null);
    setErr(false);
    fetchText(`knowledge/handbooks/${path}`)
      .then(setMd)
      .catch(() => setErr(true));
    fetchJson<BookIndex>(`knowledge/handbooks/${book}/_index.json`).then(setIndex).catch(() => setIndex(null));
  }, [path, book]);
  useEffect(() => {
    if (md && anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ block: 'start' }), 50);
  }, [md, anchor]);
  const parsed = useMemo(() => (md ? stripFrontMatter(md) : null), [md]);
  if (err) return <ErrorState what="This handbook section could not be loaded." why={`knowledge/handbooks/${path} is not in the deployment.`} todo="Open the library and pick the section again." />;
  if (!parsed) return <Loading />;
  const idx = index?.parts.findIndex((p) => p.file === file) ?? -1;
  const prev = idx > 0 ? index!.parts[idx - 1] : null;
  const next = index && idx >= 0 && idx < index.parts.length - 1 ? index.parts[idx + 1] : null;
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_260px]">
      <article className="min-w-0 rounded-lg border border-line bg-panel p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-meta text-ink-3">
          <Link to="/knowledge" className="text-accent-2 hover:underline">
            Library
          </Link>
          / {parsed.meta.handbook_title} <DataTypeBadge t={parsed.meta.data_type} /> <VerificationBadge v={parsed.meta.verification_status} />
        </div>
        {/* chapters that start at '##' (automation handbook) are promoted so the page has one h1 */}
        <Markdown source={parsed.body} highlight={hl} shift={/^# /m.test(parsed.body) ? 0 : -1} />
        <div className="mt-4 flex justify-between text-body">
          {prev ? <Link className="text-accent-2" to={`/knowledge/${book}/${prev.file}`}>← {prev.title}</Link> : <span />}
          {next ? <Link className="text-accent-2" to={`/knowledge/${book}/${next.file}`}>{next.title} →</Link> : <span />}
        </div>
        <p className="mt-3 border-t border-line pt-2 text-meta text-ink-3">Source: {parsed.meta.source_document} · {parsed.meta.transcription}</p>
      </article>
      <aside className="no-print">
        <Card title="In this part">
          <ul className="max-h-[70vh] space-y-0.5 overflow-y-auto text-body">
            {parsed.body
              .split('\n')
              .filter((l) => /^#{2,3} /.test(l))
              .map((l) => {
                const t = l.replace(/^#+ /, '');
                const a = t.toLowerCase().replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                return (
                  <li key={a} className={l.startsWith('###') ? 'pl-3' : ''}>
                    <Link className="text-ink-2 hover:text-accent-2" to={`/knowledge/${path}?a=${a}`}>
                      {t}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </Card>
      </aside>
    </div>
  );
}

export default function KnowledgePage() {
  const loc = useLocation();
  const path = decodeURIComponent(loc.pathname.replace(/^\/knowledge\/?/, ''));
  if (!path) return <Library />;
  const bookOnly = /^(laser|automation|semiconductor)\/?$/.exec(path);
  if (bookOnly) return <Library only={bookOnly[1]} />;
  if (!/^(laser|automation|semiconductor)\/[\w.-]+\.md$/.test(path)) return <EmptyState title="Unknown handbook path" explain={path} />;
  return <Reader path={path} />;
}
