/**
 * Split a handbook Markdown part into searchable sections (## and ### headings).
 * Shared by the build-time indexer and the in-app knowledge reader so anchors always agree.
 */
export interface KnowledgeSection {
  id: string;
  book: string;
  file: string;
  anchor: string;
  heading: string;
  level: number;
  part: string;
  body: string;
}

export function anchorSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function stripFrontMatter(md: string): { meta: Record<string, string>; body: string } {
  if (!md.startsWith('---')) return { meta: {}, body: md };
  const end = md.indexOf('\n---', 3);
  if (end < 0) return { meta: {}, body: md };
  const meta: Record<string, string> = {};
  for (const line of md.slice(3, end).split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, '');
  }
  return { meta, body: md.slice(end + 4).replace(/^\n/, '') };
}

export function chunkMarkdown(book: string, file: string, md: string): KnowledgeSection[] {
  const { meta, body } = stripFrontMatter(md);
  const part = (meta.part_title ?? file).replace(/^"|"$/g, '');
  const lines = body.split('\n');
  const out: KnowledgeSection[] = [];
  let cur: { heading: string; level: number; lines: string[] } = { heading: part, level: 1, lines: [] };
  const flush = () => {
    const text = cur.lines.join('\n').trim();
    if (!text && cur.level > 1) return;
    const anchor = anchorSlug(cur.heading);
    out.push({
      id: `kn-${book}.${file.replace(/\.md$/, '')}.${anchor}`.slice(0, 180),
      book,
      file,
      anchor,
      heading: cur.heading,
      level: cur.level,
      part,
      body: text,
    });
  };
  for (const l of lines) {
    const m = /^(#{1,3}) (.*)$/.exec(l);
    if (m) {
      flush();
      cur = { heading: m[2].trim(), level: m[1].length, lines: [] };
    } else cur.lines.push(l);
  }
  flush();
  // de-duplicate ids (repeated headings like "Objective")
  const seen = new Map<string, number>();
  for (const s of out) {
    const n = seen.get(s.id) ?? 0;
    seen.set(s.id, n + 1);
    if (n) s.id = `${s.id}-${n + 1}`;
  }
  return out;
}

/** Plain-text rendering of a section body for indexing (drops table rules and markup). */
export function sectionPlainText(body: string): string {
  return body
    .replace(/^\|?-{3,}.*$/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/[*_`#>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const BOOK_TITLES: Record<string, string> = {
  laser: 'The Complete Laser Handbook',
  automation: 'Automation Equipment Building Handbook',
  semiconductor: 'The Complete Semiconductor Industry Handbook',
};
