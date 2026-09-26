import type { AnyRecord } from '../domain';
import type { Application, Domain, Technology } from '../domain/entities';

/**
 * CROSS-DOMAIN INTELLIGENCE (final master prompt §27): one technology, many industries.
 * Two kinds of evidence, shown separately so neither is mistaken for the other:
 *   - TEAL application records — applications whose recommended laser source belongs to the
 *     technology and whose industries belong to the domain (real TEAL data);
 *   - domain taxonomy — the domain lists the technology, or names it in its process / subsystem /
 *     equipment lists (the master prompt's own structure).
 */
export interface CrossCell {
  applications: Application[];
  taxonomy: string[];
}
export interface CrossRow {
  technology: Technology;
  cells: Map<string, CrossCell>;
  domains: number;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** words that identify a technology in taxonomy text (its name minus generic words) */
function techWords(t: Technology): string[] {
  const n = norm(t.name).replace(/\b(laser|technology|control|scanning|battery|automated|optical|inspection)\b/g, ' ').trim();
  const words = [n, ...norm(t.name).split(' ').filter((w) => /^(aoi|plc|galvo|vision|robotics|motion|mopa|uv|green|blue|co2|fiber|femtosecond|picosecond|nanosecond|excimer|mes)$/.test(w))];
  return [...new Set(words.filter((w) => w.length >= 2))];
}

export function crossDomainMatrix(records: AnyRecord[]): { domains: Domain[]; rows: CrossRow[] } {
  const domains = (records.filter((r) => r.entity === 'domain') as unknown as Domain[]).sort((a, b) => a.order - b.order);
  const techs = records.filter((r) => r.entity === 'technology') as unknown as Technology[];
  const apps = records.filter((r) => r.entity === 'application') as unknown as Application[];
  const industries = records.filter((r) => r.entity === 'industry') as unknown as { id: string; name: string; code?: string }[];
  const industryIdFor = (label: string) => {
    const l = norm(label);
    return industries.find((i) => norm(i.code ?? '') === l || norm(i.name).startsWith(l) || l.startsWith(norm(i.name).split(' ')[0]))?.id;
  };
  const rows: CrossRow[] = techs.map((t) => {
    const cells = new Map<string, CrossCell>();
    const words = techWords(t);
    for (const d of domains) {
      const dInd = new Set(d.industry_ids ?? []);
      const appHits = (t.laser_source_ids?.length ? apps : []).filter(
        (a) => a.recommended_source_id && t.laser_source_ids!.includes(a.recommended_source_id) && (a.industries ?? []).some((i) => { const id = industryIdFor(i); return id && dInd.has(id); }),
      );
      const listed = (d.technology_ids ?? []).includes(t.id);
      const text = [...d.lifecycle, ...d.sections.flatMap((s) => s.items), ...d.equipment_fields].map(norm);
      const taxonomy = [...new Set(text.filter((x) => !/\blevel\b/.test(x) && words.some((w) => new RegExp(`\\b${w}\\b`).test(x))))].slice(0, 6);
      if (listed && !taxonomy.length) taxonomy.push('listed in the domain’s technologies');
      if (appHits.length || taxonomy.length) cells.set(d.id, { applications: appHits, taxonomy });
    }
    return { technology: t, cells, domains: cells.size };
  });
  return { domains, rows: rows.filter((r) => r.domains > 0).sort((a, b) => b.domains - a.domains || a.technology.name.localeCompare(b.technology.name)) };
}
