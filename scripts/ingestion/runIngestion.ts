/**
 * INGESTION PIPELINE (spec §101): Source → raw → parser → normalizer → dedupe → evidence →
 * validation → ingestion/candidates/<source>/ (review) → pull request → human approval → merge.
 *
 *   npx tsx scripts/ingestion/runIngestion.ts [source-id ...]      (default: every enabled source)
 */
import { loadAllRecords } from '../lib/loadAll';
import { deduplicate } from './deduplicate';
import { discoverSources } from './discoverSources';
import { fetchSource, FetchRefused, type FetchOptions } from './fetchSource';
import { generateEvidence } from './generateEvidence';
import type { SourceManifest } from './manifest';
import { normalizeProduct, sourceRecord } from './normalizeProduct';
import { parseProduct, parseRows } from './parseProduct';
import { writeCandidates, type CandidateOutput } from './validateDataset';
import type { AnyRecord } from '../../src/domain';

export async function ingest(m: SourceManifest, master: AnyRecord[], opts: FetchOptions & { candidatesDir?: string } = {}): Promise<CandidateOutput> {
  const snap = await fetchSource(m, opts);
  const rows = parseRows(snap.text, m);
  const parsed = parseProduct(rows, m);
  const cands = parsed.map((r) => normalizeProduct(r, m, snap.retrieved_at));
  const dd = deduplicate(cands, master);
  const evidence = [...dd.created, ...dd.changed].flatMap((c) => generateEvidence(c, m, snap.retrieved_at));
  return writeCandidates(m, snap.retrieved_at, snap.sha256, sourceRecord(m, snap.retrieved_at), dd, evidence, { dir: opts.candidatesDir, write: opts.write });
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop() ?? '');
if (isMain) {
  const want = process.argv.slice(2);
  const { runnable, invalid } = discoverSources();
  if (invalid.length) {
    for (const i of invalid) console.error(`✖ invalid manifest ${i.file}: ${i.error}`);
    process.exit(1);
  }
  const selected = runnable.filter((r) => !want.length || want.includes(r.manifest!.id));
  if (!selected.length) {
    console.log('No enabled sources to ingest. Add a reviewed manifest under ingestion/sources/ (see ingestion/README.md).');
    process.exit(0);
  }
  const master = loadAllRecords().records as unknown as AnyRecord[];
  let failed = false;
  for (const { manifest: m } of selected) {
    try {
      const out = await ingest(m!, master);
      console.log(`✔ ${m!.id}: ${JSON.stringify(out.counts)} → ${out.dir}/REVIEW.md`);
    } catch (e) {
      failed = true;
      console.error(`${e instanceof FetchRefused ? '⛔ refused' : '✖ failed'} ${m!.id}: ${(e as Error).message}`);
    }
  }
  if (failed) process.exit(1);
}
