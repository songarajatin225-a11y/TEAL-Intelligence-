import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AnyRecord } from '../../src/domain';
import { validateRecord } from '../../src/repositories';
import { deduplicate } from '../../scripts/ingestion/deduplicate';
import { fetchSource, FetchRefused } from '../../scripts/ingestion/fetchSource';
import { generateEvidence } from '../../scripts/ingestion/generateEvidence';
import { SourceManifest } from '../../scripts/ingestion/manifest';
import { companyId, companyKey } from '../../scripts/ingestion/normalizeCompany';
import { normalizeProduct } from '../../scripts/ingestion/normalizeProduct';
import { parseProduct, parseRows } from '../../scripts/ingestion/parseProduct';
import { isAllowed, parseRobots } from '../../scripts/ingestion/robots';
import { ingest } from '../../scripts/ingestion/runIngestion';

// All names in the fixture are fictional (test-only) — never real products or companies.
const ROOT = join(__dirname, '..', '..');
const manifest = SourceManifest.parse({
  ...(await import('../../ingestion/sources/_template.json')).default,
  id: 'fictional-test',
  location: 'tests/fixtures/ingestion/fictional-catalogue.csv',
  enabled: true,
});
const fileOpts = { inboxDir: join(ROOT, 'tests', 'fixtures', 'ingestion'), write: false, noWait: true, now: new Date('2026-09-01T10:00:00Z') };

describe('robots.txt (RFC 9309)', () => {
  const robots = parseRobots(`User-agent: *\nDisallow: /private/\nAllow: /private/datasheets/\nDisallow: /*.pdf$\n\nUser-agent: TEAL-Intelligence-Ingestion\nDisallow: /`);
  it('uses the most specific group and longest match', () => {
    expect(isAllowed(robots, 'SomeBot/1.0', '/products')).toBe(true);
    expect(isAllowed(robots, 'SomeBot/1.0', '/private/x')).toBe(false);
    expect(isAllowed(robots, 'SomeBot/1.0', '/private/datasheets/a')).toBe(true);
    expect(isAllowed(robots, 'SomeBot/1.0', '/files/a.pdf')).toBe(false);
    expect(isAllowed(robots, 'SomeBot/1.0', '/files/a.pdf?x=1')).toBe(true);
    expect(isAllowed(robots, 'TEAL-Intelligence-Ingestion/1.0 (+https://…)', '/products')).toBe(false);
  });
  it('an empty Disallow allows everything', () => {
    expect(isAllowed(parseRobots('User-agent: *\nDisallow:'), 'x', '/anything')).toBe(true);
  });
});

describe('company normalization', () => {
  it('maps legal-form and case variants to one id', () => {
    expect(companyKey('Fictional Photonics GmbH')).toBe('fictional-photonics');
    expect(companyId('FICTIONAL PHOTONICS')).toBe(companyId('Fictional Photonics GmbH'));
    expect(companyId('Test Lasers Ltd.')).toBe('co-test-lasers');
  });
});

describe('fetchSource respects boundaries', () => {
  const http = { ...manifest, kind: 'http' as const, location: 'https://example.com/catalogue.csv' };
  const mock = (robots: string | number, body: { status: number; text?: string; type?: string }) =>
    (async (url: string | URL) => {
      if (String(url).endsWith('/robots.txt')) return typeof robots === 'number' ? new Response('', { status: robots }) : new Response(robots, { status: 200 });
      return new Response(body.text ?? '', { status: body.status, headers: { 'content-type': body.type ?? 'text/csv' } });
    }) as typeof fetch;
  it('refuses when robots.txt disallows', async () => {
    await expect(fetchSource(http, { ...fileOpts, fetchImpl: mock('User-agent: *\nDisallow: /', { status: 200 }) })).rejects.toBeInstanceOf(FetchRefused);
  });
  it('treats an unreachable robots.txt (5xx) as disallowed', async () => {
    await expect(fetchSource(http, { ...fileOpts, fetchImpl: mock(503, { status: 200 }) })).rejects.toThrow(/treat as disallowed/);
  });
  it('never works around authentication, paywalls or rate limits', async () => {
    for (const status of [401, 402, 403, 429]) await expect(fetchSource(http, { ...fileOpts, fetchImpl: mock(404, { status }) })).rejects.toBeInstanceOf(FetchRefused);
  });
  it('stops at CAPTCHA / bot challenges', async () => {
    await expect(fetchSource(http, { ...fileOpts, fetchImpl: mock(404, { status: 200, type: 'text/html', text: '<p>Please verify you are human</p>' }) })).rejects.toThrow(/CAPTCHA/);
  });
  it('refuses disabled sources, plain http and files outside the inbox', async () => {
    await expect(fetchSource({ ...manifest, enabled: false }, fileOpts)).rejects.toThrow(/disabled/);
    await expect(fetchSource({ ...http, location: 'http://example.com/x.csv' }, { ...fileOpts, fetchImpl: mock(404, { status: 200 }) })).rejects.toThrow(/https/);
    await expect(fetchSource({ ...manifest, location: 'package.json' }, fileOpts)).rejects.toThrow(/inbox/);
  });
});

describe('parse → normalize → dedupe → evidence → validate', () => {
  it('keeps original text, converts units, and reports what it cannot read', async () => {
    const snap = await fetchSource(manifest, fileOpts);
    const rows = parseProduct(parseRows(snap.text, manifest), manifest);
    expect(rows[1].fields.wavelength).toEqual({ value: 1064, unit: 'nm', original: '1.064 µm', status: 'SOURCE_DOCUMENTED' });
    expect(rows[0].fields.average_power_w).toEqual([20, 30]);
    expect(rows[3].fields.m2).toBeUndefined(); // "n/a" stays unknown — never guessed
    expect(rows[3].excerpts.mode).toMatch(/manifest constant/);
  });

  it('flags duplicate rows that disagree, and master conflicts as CONFLICTED', async () => {
    const snap = await fetchSource(manifest, fileOpts);
    const cands = parseProduct(parseRows(snap.text, manifest), manifest).map((r) => normalizeProduct(r, manifest, snap.retrieved_at));
    const master = [{ ...cands[0].record, m2: 1.1 } as AnyRecord];
    const dd = deduplicate(cands, master);
    expect(dd.changed.map((c) => c.record.id)).toEqual(['las-fictional-photonics-fx-20']);
    expect(dd.changed[0].record.provenance.verification_status).toBe('CONFLICTED');
    expect(dd.changed[0].diffs.map((d) => d.field)).toContain('m2');
    // "Fictional Photonics GmbH" and "FICTIONAL PHOTONICS" are one manufacturer → one FX-50, whose rows disagree on M²
    expect(dd.duplicatesInBatch).toEqual([{ id: 'las-fictional-photonics-fx-50', rows: [1, 2], diffs: [{ field: 'm2', master: 1.5, source: 1.6 }] }]);
    expect(dd.created.find((c) => c.record.id === 'las-fictional-photonics-fx-50')!.problems.join(' ')).toMatch(/disagree on m2/);
    // the row without manufacturer/model is held back
    expect(cands[4].problems.join(' ')).toMatch(/key columns/);
  });

  it('writes schema-valid candidates and evidence only (nothing into /data)', async () => {
    const out = await ingest(manifest, [], fileOpts);
    expect(out.counts.created).toBe(4);
    expect(out.counts.rowProblems).toBe(2); // conflicting duplicate + keyless row
    expect(out.counts.invalid).toBe(0);
    expect(out.counts.evidence).toBeGreaterThanOrEqual(12);
    expect(out.report).toMatch(/Reviewer checklist/);
    expect(out.dir).toMatch(/ingestion[\\/]candidates[\\/]fictional-test$/);
  });

  it('evidence records validate and point at their record', async () => {
    const snap = await fetchSource(manifest, fileOpts);
    const [row] = parseProduct(parseRows(snap.text, manifest), manifest);
    const c = normalizeProduct(row, manifest, snap.retrieved_at);
    const ev = generateEvidence(c, manifest, snap.retrieved_at);
    expect(ev.length).toBe(Object.keys(row.excerpts).length);
    for (const e of ev) {
      expect(() => validateRecord(e as Record<string, unknown>)).not.toThrow();
      expect((e as unknown as { entity_id: string }).entity_id).toBe(c.record.id);
    }
  });
});
