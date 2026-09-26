/**
 * List the declared sources and whether each may run (spec §100). Discovery never searches the
 * web: a source exists only once a reviewed manifest is merged into ingestion/sources/.
 *
 *   npx tsx scripts/ingestion/discoverSources.ts
 */
import { loadManifests, type LoadedManifest } from './manifest';

export function discoverSources(): { runnable: LoadedManifest[]; disabled: LoadedManifest[]; invalid: LoadedManifest[] } {
  const all = loadManifests();
  return {
    runnable: all.filter((m) => m.manifest?.enabled),
    disabled: all.filter((m) => m.manifest && !m.manifest.enabled),
    invalid: all.filter((m) => m.error),
  };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop() ?? '');
if (isMain) {
  const d = discoverSources();
  console.log(`Sources: ${d.runnable.length} enabled · ${d.disabled.length} disabled · ${d.invalid.length} invalid`);
  for (const m of d.runnable) console.log(`  ✔ ${m.manifest!.id} — ${m.manifest!.name} (${m.manifest!.kind} ${m.manifest!.format} → ${m.manifest!.target_entity}; ${m.manifest!.permission.basis}, reviewed ${m.manifest!.permission.reviewed_at} by ${m.manifest!.permission.reviewed_by})`);
  for (const m of d.disabled) console.log(`  · ${m.manifest!.id} — disabled`);
  for (const m of d.invalid) console.log(`  ✖ ${m.file}: ${m.error}`);
  if (d.invalid.length) process.exit(1);
}
