/**
 * Generate JSON Schemas (draft 2020-12) for every entity from the Zod domain schemas, so
 * datasets can be validated and edited outside this codebase (spec §15).
 *
 *   npm run data:schemas   → schemas/<entity>.schema.json + schemas/dataset.schema.json
 *
 * The Zod schemas in src/domain are the single source of truth; these files are generated.
 */
import { join } from 'node:path';
import { z } from 'zod';
import { DatasetHeader } from '../../src/domain/common';
import { ENTITY_DEFS } from '../../src/domain/registry';
import { ROOT, writeJson } from '../lib/dataset';

const OUT = join(ROOT, 'schemas');

function main() {
  let n = 0;
  for (const def of ENTITY_DEFS) {
    const schema = z.toJSONSchema(def.schema, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>;
    writeJson(join(OUT, `${def.entity}.schema.json`), {
      $id: `https://songarajatin225-a11y.github.io/TEAL-Intelligence-/schemas/${def.entity}.schema.json`,
      title: def.label,
      description: `TEAL Engineering Intelligence OS — ${def.label} record (id prefix "${def.prefix}-"). Generated from src/domain; do not edit.`,
      ...schema,
    });
    n++;
  }
  const header = z.toJSONSchema(DatasetHeader, { io: 'input' }) as Record<string, unknown>;
  writeJson(join(OUT, 'dataset.schema.json'), {
    $id: 'https://songarajatin225-a11y.github.io/TEAL-Intelligence-/schemas/dataset.schema.json',
    title: 'TEAL dataset file',
    description: 'Every file under /data: a `dataset` header plus `records` (or `config` for configuration datasets). Records are validated per entity schema.',
    type: 'object',
    required: ['dataset'],
    properties: {
      dataset: header,
      records: { type: 'array', items: { type: 'object' } },
      config: { type: 'object' },
    },
  });
  console.log(`Wrote ${n} entity schemas + dataset.schema.json to schemas/`);
}

main();
