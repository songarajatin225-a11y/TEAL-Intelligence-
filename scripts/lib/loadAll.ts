import { isConfig, listDatasetFiles, loadDataset, relPath, resolveRelativeDates } from './dataset';

export interface LoadedRecord extends Record<string, unknown> {
  id: string;
  entity: string;
}

/** All records from all record datasets, with demo relative dates resolved. */
export function loadAllRecords(): { records: LoadedRecord[]; byFile: Map<string, LoadedRecord[]> } {
  const records: LoadedRecord[] = [];
  const byFile = new Map<string, LoadedRecord[]>();
  for (const p of listDatasetFiles()) {
    const d = loadDataset(p);
    if (isConfig(d)) continue;
    const rows = (d.dataset.relative_dates ? resolveRelativeDates(d.records) : d.records) as LoadedRecord[];
    records.push(...rows);
    byFile.set(relPath(p), rows);
  }
  return { records, byFile };
}
