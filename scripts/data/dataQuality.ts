/**
 * CI data-quality gate (spec §104, §129) → reports/data-quality.json + reports/data-quality.md
 * Fails (exit 1) on errors: broken references, unregistered sources, duplicate ids, unknown entities.
 *   npm run data:quality
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AnyRecord } from '../../src/domain';
import { reportMarkdown, runDataQuality } from '../../src/services/dataQuality';
import { REPORTS_DIR, writeJson } from '../lib/dataset';
import { loadAllRecords } from '../lib/loadAll';

const { records } = loadAllRecords();
const report = runDataQuality(records as unknown as AnyRecord[]);
writeJson(join(REPORTS_DIR, 'data-quality.json'), report);
writeFileSync(join(REPORTS_DIR, 'data-quality.md'), reportMarkdown(report), 'utf-8');
console.log(`Data quality: ${report.records} records · ${report.errors} errors · ${report.warnings} warnings → reports/data-quality.{json,md}`);
if (report.errors) {
  for (const i of report.issues.filter((x) => x.severity === 'error').slice(0, 50)) console.error(`  ✖ ${i.check} ${i.id ?? ''}: ${i.message}`);
  process.exit(1);
}
