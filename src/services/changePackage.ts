import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import type { ChangeLogRow, DraftRow } from '../repositories/workspaceDb';
import { createZip, readZip } from '../utils/zip';

/**
 * TEAL CHANGE PACKAGE (spec §92–§93). Local drafts are exported as a ZIP:
 *   manifest.json · data/<entity>/<id>.json · changes/changelog.json · documents/README.md
 * Applying it to the repository is a reviewed Git change (scripts/data/applyChangePackage.ts
 * → pull request). The OS never claims master data changed until that PR merges.
 */
export const CHANGE_PACKAGE_VERSION = '1.0';

export interface ChangePackageManifest {
  format: 'teal-change-package';
  version: string;
  created_at: string;
  created_by: string;
  datasets: string[];
  records: { id: string; entity: string; name: string; action: 'create' | 'update' | 'delete'; path: string }[];
  changes: number;
  note: string;
}

export function buildChangePackage(drafts: DraftRow[], changelog: ChangeLogRow[], createdBy: string, note = ''): { manifest: ChangePackageManifest; zip: Uint8Array } {
  const records: ChangePackageManifest['records'] = [];
  const files: { path: string; data: string }[] = [];
  for (const d of drafts) {
    const def = ENTITY_BY_TYPE[d.entity];
    const path = `data/${d.entity}/${d.id}.json`;
    const action = d.deleted ? 'delete' : d.overrides_master ? 'update' : 'create';
    records.push({ id: d.id, entity: d.entity, name: String(d.record.name ?? d.id), action, path });
    files.push({ path, data: JSON.stringify(d.deleted ? { id: d.id, entity: d.entity, __delete: true } : d.record, null, 2) + '\n' });
    void def;
  }
  const manifest: ChangePackageManifest = {
    format: 'teal-change-package',
    version: CHANGE_PACKAGE_VERSION,
    created_at: new Date().toISOString(),
    created_by: createdBy || 'unknown',
    datasets: [...new Set(drafts.map((d) => d.entity))].sort(),
    records,
    changes: changelog.length,
    note: note || 'Local drafts exported from TEAL Engineering Intelligence OS. Review before committing.',
  };
  const zip = createZip([
    { path: 'manifest.json', data: JSON.stringify(manifest, null, 2) + '\n' },
    ...files,
    { path: 'changes/changelog.json', data: JSON.stringify(changelog, null, 2) + '\n' },
    {
      path: 'documents/README.md',
      data: `# TEAL Change Package\n\nCreated ${manifest.created_at} by ${manifest.created_by}.\n\n${manifest.note}\n\nApply with:\n\n    npx tsx scripts/data/applyChangePackage.ts <this-file.zip>\n\nthen open a pull request. Permanent repository updates require a GitHub commit.\n`,
    },
  ]);
  return { manifest, zip };
}

export interface ParsedChangePackage {
  manifest: ChangePackageManifest;
  records: (AnyRecord | { id: string; entity: string; __delete: true })[];
}

export function parseChangePackage(bytes: Uint8Array): ParsedChangePackage {
  const files = readZip(bytes);
  const m = files.get('manifest.json');
  if (!m) throw new Error('manifest.json missing — not a TEAL change package');
  const manifest = JSON.parse(m) as ChangePackageManifest;
  if (manifest.format !== 'teal-change-package') throw new Error('Unrecognised package format');
  const records = manifest.records.map((r) => {
    const f = files.get(r.path);
    if (!f) throw new Error(`Package is missing ${r.path}`);
    return JSON.parse(f);
  });
  return { manifest, records };
}
