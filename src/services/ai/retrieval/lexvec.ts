import { MINISEARCH_OPTIONS } from '../../searchDocs';

/*
 * LEXICAL VECTOR INDEX (AI master prompt §13 — replaceable embedding infrastructure).
 * Honest label: this is NOT a neural embedding. Each document becomes a sparse TF-IDF vector over
 * hashed word tokens plus character trigrams of longer words (spelling tolerance: "fibre"/"fiber",
 * "galvanometer"/"galvo"). Cosine similarity ranks documents that share vocabulary. The interface
 * (embed → vector, search → ranked ids) is the one a neural embedding provider will implement behind
 * the AI gateway, so swapping it later changes no caller.
 */
export const DIMS = 1 << 13;

export type SparseVec = Map<number, number>;

export interface VecDoc {
  id: string;
  text: string;
  /** stored metadata (§13): entity_type, source, timestamp, … */
  meta?: Record<string, string>;
}

export interface VectorIndex {
  kind: 'lexical-tfidf-hashed';
  dims: number;
  size: number;
  idf: Float32Array;
  docs: { id: string; vec: SparseVec; meta?: Record<string, string> }[];
  builtAt: string;
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % DIMS;
}

const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'what', 'which', 'how', 'can', 'use', 'used', 'into', 'our', 'you', 'your', 'not', 'all', 'any', 'per', 'its', 'has', 'have', 'will', 'should', 'need', 'find', 'show', 'list']);

/** Features of a text: word tokens (weight 1) and character trigrams of words ≥ 5 chars (weight 0.35). */
export function features(text: string): Map<number, number> {
  const f = new Map<number, number>();
  const add = (k: number, w: number) => f.set(k, (f.get(k) ?? 0) + w);
  for (const t of MINISEARCH_OPTIONS.tokenize(text)) {
    if (t.length < 2 || STOP.has(t)) continue;
    add(fnv1a(`w:${t}`), 1);
    if (t.length >= 5 && !/^\d/.test(t)) for (let i = 0; i + 3 <= t.length; i++) add(fnv1a(`c:${t.slice(i, i + 3)}`), 0.35);
  }
  return f;
}

function normalise(v: SparseVec): SparseVec {
  let n = 0;
  v.forEach((x) => (n += x * x));
  n = Math.sqrt(n) || 1;
  const out: SparseVec = new Map();
  v.forEach((x, k) => out.set(k, x / n));
  return out;
}

export function buildVectorIndex(docs: VecDoc[]): VectorIndex {
  const df = new Float32Array(DIMS);
  const feats = docs.map((d) => features(d.text));
  for (const f of feats) f.forEach((_, k) => (df[k] += 1));
  const N = docs.length || 1;
  const idf = new Float32Array(DIMS);
  for (let k = 0; k < DIMS; k++) idf[k] = Math.log(1 + N / (1 + df[k]));
  return {
    kind: 'lexical-tfidf-hashed',
    dims: DIMS,
    size: docs.length,
    idf,
    docs: docs.map((d, i) => {
      const v: SparseVec = new Map();
      feats[i].forEach((tf, k) => v.set(k, (1 + Math.log(tf)) * idf[k]));
      return { id: d.id, vec: normalise(v), meta: d.meta };
    }),
    builtAt: new Date().toISOString(),
  };
}

export function embedQuery(idx: VectorIndex, text: string): SparseVec {
  const v: SparseVec = new Map();
  features(text).forEach((tf, k) => v.set(k, (1 + Math.log(tf)) * idx.idf[k]));
  return normalise(v);
}

export function cosine(a: SparseVec, b: SparseVec): number {
  const [s, l] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  s.forEach((x, k) => {
    const y = l.get(k);
    if (y) dot += x * y;
  });
  return dot;
}

export interface VecHit {
  id: string;
  score: number;
  meta?: Record<string, string>;
}

export function vectorSearch(idx: VectorIndex, text: string, k = 30, filter?: (meta?: Record<string, string>) => boolean): VecHit[] {
  const q = embedQuery(idx, text);
  if (!q.size) return [];
  const out: VecHit[] = [];
  for (const d of idx.docs) {
    if (filter && !filter(d.meta)) continue;
    const s = cosine(q, d.vec);
    if (s > 0.05) out.push({ id: d.id, score: s, meta: d.meta });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, k);
}
