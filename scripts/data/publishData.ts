/**
 * Copy the master data and knowledge into /public so Vite ships them as static files.
 * public/data and public/knowledge are build artefacts (git-ignored).
 *   npm run data:publish
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR, PUBLIC_DIR, ROOT } from '../lib/dataset';

const outData = join(PUBLIC_DIR, 'data');
const outKnowledge = join(PUBLIC_DIR, 'knowledge');
const outSchemas = join(PUBLIC_DIR, 'schemas');
for (const d of [outData, outKnowledge, outSchemas]) if (existsSync(d)) rmSync(d, { recursive: true });
mkdirSync(outData, { recursive: true });
cpSync(DATA_DIR, outData, { recursive: true, filter: (src) => !src.endsWith('.md') });
cpSync(join(ROOT, 'knowledge'), outKnowledge, { recursive: true, filter: (src) => !/\.(docx|py)$/.test(src) });
if (existsSync(join(ROOT, 'schemas'))) cpSync(join(ROOT, 'schemas'), outSchemas, { recursive: true });
console.log('✔ Published data → public/data, knowledge → public/knowledge, schemas → public/schemas');
