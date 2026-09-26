/**
 * FETCH SOURCE (spec §21, §100). Reads one declared source into a raw snapshot:
 *   - file: only from ingestion/inbox/ (files a manufacturer or licensor gave us, or open-data downloads)
 *   - http: https only; robots.txt checked first (RFC 9309); one request, rate-limited; no redirects
 *     followed silently; 401/402/403/407 (authentication, paywall) and 429 (rate limit) are respected,
 *     never worked around; CAPTCHA / bot-challenge pages abort the run.
 * Raw snapshots go to ingestion/raw/ (git-ignored — third-party content is not republished) with a
 * .meta.json recording URL, retrieval time and SHA-256.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { ROOT } from '../lib/dataset';
import { USER_AGENT, type SourceManifest } from './manifest';
import { isAllowed, parseRobots } from './robots';

export const INBOX_DIR = join(ROOT, 'ingestion', 'inbox');
export const RAW_DIR = join(ROOT, 'ingestion', 'raw');
const MAX_BYTES = 20 * 1024 * 1024;

export interface RawSnapshot {
  source_id: string;
  location: string;
  retrieved_at: string;
  sha256: string;
  content_type: string;
  bytes: number;
  path: string | null;
  text: string;
}

export class FetchRefused extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface FetchOptions {
  fetchImpl?: typeof fetch;
  rawDir?: string;
  inboxDir?: string;
  now?: Date;
  /** tests: skip the rate-limit wait */
  noWait?: boolean;
  write?: boolean;
}

export async function fetchSource(m: SourceManifest, opts: FetchOptions = {}): Promise<RawSnapshot> {
  if (!m.enabled) throw new FetchRefused(`Source ${m.id} is disabled in its manifest`);
  const now = (opts.now ?? new Date()).toISOString();
  let text: string;
  let contentType = m.format === 'csv' ? 'text/csv' : 'application/json';

  if (m.kind === 'file') {
    const inbox = resolve(opts.inboxDir ?? INBOX_DIR);
    const p = resolve(ROOT, m.location);
    if (!p.startsWith(inbox + sep)) throw new FetchRefused(`File sources must live under ingestion/inbox/ (got ${m.location})`);
    text = readFileSync(p, 'utf-8');
  } else {
    const f = opts.fetchImpl ?? fetch;
    const url = new URL(m.location);
    if (url.protocol !== 'https:') throw new FetchRefused('Only https sources are fetched');
    // 1. robots.txt
    const robotsRes = await f(`${url.origin}/robots.txt`, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' }).catch(() => null);
    if (!robotsRes || robotsRes.status >= 500) throw new FetchRefused(`robots.txt for ${url.host} is unreachable (${robotsRes?.status ?? 'network error'}) — RFC 9309: treat as disallowed`);
    if (robotsRes.ok && !isAllowed(parseRobots(await robotsRes.text()), USER_AGENT, url.pathname + url.search)) {
      throw new FetchRefused(`robots.txt of ${url.host} disallows ${url.pathname} for our user agent`);
    }
    if (!opts.noWait) await sleep(m.rate_limit_ms);
    // 2. the resource itself
    const res = await f(url, { headers: { 'User-Agent': USER_AGENT, Accept: m.format === 'csv' ? 'text/csv, text/plain' : 'application/json' }, redirect: 'manual' });
    if ([401, 402, 403, 407].includes(res.status)) throw new FetchRefused(`${res.status}: the source requires authentication or payment — not bypassed. Use a licensed API or a file the owner provides.`);
    if (res.status === 429) throw new FetchRefused('429: rate limited by the source — try later; do not retry aggressively');
    if (res.status >= 300 && res.status < 400) throw new FetchRefused(`${res.status} redirect to ${res.headers.get('location')} — review the final URL and update the manifest`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    contentType = res.headers.get('content-type') ?? contentType;
    const len = Number(res.headers.get('content-length') ?? 0);
    if (len > MAX_BYTES) throw new FetchRefused(`Response too large (${len} bytes) — use a bulk download or licensed API`);
    text = await res.text();
    if (/html/i.test(contentType) && /captcha|cf-challenge|are you (a )?(human|robot)|verify you are human/i.test(text)) {
      throw new FetchRefused('The source answered with a bot challenge / CAPTCHA — stopping. Automated access is not permitted there.');
    }
  }
  if (text.length > MAX_BYTES) throw new FetchRefused('Source too large');
  const sha256 = createHash('sha256').update(text).digest('hex');
  const snap: RawSnapshot = { source_id: m.id, location: m.location, retrieved_at: now, sha256, content_type: contentType, bytes: Buffer.byteLength(text), path: null, text };
  if (opts.write !== false) {
    const dir = join(opts.rawDir ?? RAW_DIR, m.id);
    mkdirSync(dir, { recursive: true });
    const base = now.replace(/[:.]/g, '-');
    const path = join(dir, `${base}.${m.format}`);
    writeFileSync(path, text);
    const { text: _t, ...meta } = { ...snap, path };
    void _t;
    writeFileSync(join(dir, `${base}.meta.json`), JSON.stringify(meta, null, 2) + '\n');
    snap.path = path;
  }
  return snap;
}
