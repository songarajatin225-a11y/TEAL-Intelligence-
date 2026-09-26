import { Fragment, type ReactNode } from 'react';
import { anchorSlug } from '../services/knowledgeChunks';

/**
 * Minimal, safe Markdown renderer for the handbook subset (headings, paragraphs, bullet lists,
 * pipe tables, *emphasis*, **bold**). Produces React elements — no HTML injection (spec §125).
 */
function inline(text: string, highlight?: RegExp | null): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (s: string) => {
    if (!highlight) {
      out.push(s);
      return;
    }
    const parts = s.split(highlight);
    parts.forEach((p, i) => out.push(i % 2 ? <mark key={`${out.length}-${i}`}>{p}</mark> : p));
  };
  while ((m = re.exec(text))) {
    push(text.slice(last, m.index));
    const tok = m[0];
    out.push(tok.startsWith('**') ? <strong key={out.length}>{tok.slice(2, -2)}</strong> : <em key={out.length}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  push(text.slice(last));
  return out;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, '|').trim());

export function Markdown({ source, highlight }: { source: string; highlight?: string }) {
  const hl = highlight?.trim() ? new RegExp(`(${highlight.trim().split(/\s+/).filter((w) => w.length > 2).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi') : null;
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    const h = /^(#{1,6}) (.*)$/.exec(l);
    if (h) {
      const lvl = Math.min(3, h[1].length);
      const Tag = `h${lvl}` as 'h1' | 'h2' | 'h3';
      blocks.push(
        <Tag key={i} id={anchorSlug(h[2])}>
          {inline(h[2], hl)}
        </Tag>,
      );
      i++;
      continue;
    }
    if (l.startsWith('|') && lines[i + 1]?.startsWith('|---')) {
      const head = cells(l);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].startsWith('|')) rows.push(cells(lines[i++]));
      blocks.push(
        <table key={i}>
          <thead>
            <tr>
              {head.map((c, k) => (
                <th key={k}>{inline(c, hl)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, k) => (
              <tr key={k}>
                {r.map((c, j) => (
                  <td key={j}>{inline(c, hl)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }
    if (l.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) items.push(lines[i++].slice(2));
      blocks.push(
        <ul key={i}>
          {items.map((t, k) => (
            <li key={k}>{inline(t, hl)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (l.trim()) blocks.push(<p key={i}>{inline(l, hl)}</p>);
    i++;
  }
  return (
    <div className="md">
      {blocks.map((b, k) => (
        <Fragment key={k}>{b}</Fragment>
      ))}
    </div>
  );
}
