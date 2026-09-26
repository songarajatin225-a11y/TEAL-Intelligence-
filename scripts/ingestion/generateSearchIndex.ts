/**
 * Build partitioned MiniSearch indexes at build time (spec §102) → public/search-index/<partition>.json
 * Records are indexed by their entity's partition; handbook sections go to `knowledge`.
 *   npm run data:index
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import MiniSearch from 'minisearch';
import { SEARCH_PARTITIONS } from '../../src/domain/registry';
import { BOOK_TITLES, chunkMarkdown, sectionPlainText } from '../../src/services/knowledgeChunks';
import { MINISEARCH_OPTIONS, recordToSearchDoc, type SearchDoc } from '../../src/services/searchDocs';
import { PUBLIC_DIR, ROOT, writeJson } from '../lib/dataset';
import { loadAllRecords } from '../lib/loadAll';

const { records } = loadAllRecords();
const docs = new Map<string, SearchDoc[]>(SEARCH_PARTITIONS.map((p) => [p, []]));
for (const r of records) {
  const d = recordToSearchDoc(r);
  docs.get(d.partition)!.push(d);
}

// Handbook sections
const hb = join(ROOT, 'knowledge', 'handbooks');
let sections = 0;
for (const book of readdirSync(hb).filter((b) => statSync(join(hb, b)).isDirectory())) {
  for (const file of readdirSync(join(hb, book)).filter((f) => f.endsWith('.md')).sort()) {
    for (const s of chunkMarkdown(book, file, readFileSync(join(hb, book, file), 'utf-8'))) {
      const text = sectionPlainText(s.body);
      if (!text) continue;
      sections++;
      docs.get('knowledge')!.push({
        id: s.id,
        entity: 'knowledge',
        name: s.heading,
        text: `${s.part} ${text}`,
        tags: `${book} handbook ${BOOK_TITLES[book] ?? ''}`,
        data_type: 'TEAL_INTERNAL',
        verification: 'SOURCE_DOCUMENTED',
        partition: 'knowledge',
        ref: `${book}/${file}#${s.anchor}`,
        book,
      });
    }
  }
}

const summary: Record<string, number> = {};
for (const [partition, list] of docs) {
  const ms = new MiniSearch<SearchDoc>(MINISEARCH_OPTIONS);
  ms.addAll(list);
  writeJson(join(PUBLIC_DIR, 'search-index', `${partition}.json`), { partition, count: list.length, index: ms.toJSON() });
  summary[partition] = list.length;
}
writeJson(join(PUBLIC_DIR, 'search-index', 'manifest.json'), { generated_at: new Date().toISOString(), partitions: summary });
console.log(`✔ Search index: ${JSON.stringify(summary)} (handbook sections: ${sections})`);
