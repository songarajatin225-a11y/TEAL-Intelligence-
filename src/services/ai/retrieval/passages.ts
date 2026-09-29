import { BOOK_TITLES, chunkMarkdown, sectionPlainText } from '../../knowledgeChunks';

/*
 * HANDBOOK PASSAGES (AI master prompt §11 — context builder). The search index stores section ids,
 * not text, so passages are fetched per matched section file (cached), cut into ~2–3 sentence windows
 * and scored against the query. The composer cites the exact window with its section link — the
 * passage is quoted, never paraphrased into a new claim.
 */

export type TextFetcher = (path: string) => Promise<string>;

export interface Passage {
  ref: string;
  book: string;
  bookTitle: string;
  heading: string;
  part: string;
  text: string;
  score: number;
  href: string;
}

const cache = new Map<string, Promise<string>>();

function windows(text: string, size = 3): string[] {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9(“"])/).map((s) => s.trim()).filter((s) => s.length > 20);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) out.push(sentences.slice(i, i + size).join(' '));
  return out.length ? out : text ? [text.slice(0, 500)] : [];
}

const QSTOP = new Set(['explain', 'what', 'which', 'why', 'how', 'does', 'describe', 'tell', 'define', 'the', 'and', 'for', 'are', 'can', 'use', 'with', 'about', 'from', 'this', 'that', 'into', 'need', 'find', 'show', 'predict', 'give', 'laser', 'lasers']);
const terms = (q: string) => q.toLowerCase().split(/[^a-z0-9µ]+/).filter((t) => t.length > 2 && !QSTOP.has(t));
/** Lookup sections (glossaries, abbreviation tables, indexes) match many words but explain nothing. */
const LOOKUP = /abbreviation|glossary|dictionary|\bindex\b|contents|acronym|nomenclature|symbols/i;

function scoreWindow(w: string, qt: string[]): number {
  const lw = w.toLowerCase();
  let s = 0;
  for (const t of qt) if (lw.includes(t)) s += 1 + Math.min(2, (lw.split(t).length - 2) * 0.25);
  return s / Math.sqrt(1 + w.length / 400);
}

/** Best passage per matched handbook section (`ref` = `book/file.md#anchor`). */
export async function fetchPassages(refs: string[], query: string, fetchText: TextFetcher, perSection = 1): Promise<Passage[]> {
  const qt = terms(query);
  const out: Passage[] = [];
  for (const [rank, ref] of refs.entries()) {
    const [path, anchor] = ref.split('#');
    const [book, file] = path.split('/');
    if (!book || !file) continue;
    let md: string;
    try {
      let p = cache.get(path);
      if (!p) {
        p = fetchText(`knowledge/handbooks/${path}`);
        cache.set(path, p);
        p.catch(() => cache.delete(path));
      }
      md = await p;
    } catch {
      continue;
    }
    const section = chunkMarkdown(book, file, md).find((s) => s.anchor === anchor);
    if (!section || LOOKUP.test(section.heading)) continue;
    const plain = sectionPlainText(section.body);
    // the section heading naming the query terms is strong evidence the section is *about* them
    const heading = section.heading.toLowerCase();
    const headBoost = qt.length ? (qt.filter((t) => heading.includes(t)).length / qt.length) * 1.5 : 0;
    const best = windows(plain)
      .map((text) => ({ text, score: scoreWindow(text, qt) + headBoost - rank * 0.15 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, perSection);
    for (const b of best) {
      if (b.score <= 0.2) continue;
      out.push({ ref, book, bookTitle: BOOK_TITLES[book] ?? book, heading: section.heading, part: section.part, text: b.text.length > 600 ? `${b.text.slice(0, 597)}…` : b.text, score: b.score, href: `/knowledge/${path}?a=${anchor}&q=${encodeURIComponent(query)}` });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}
