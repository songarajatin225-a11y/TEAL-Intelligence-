import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import { pageFor } from '../nav';

export interface Crumb {
  label: string;
  to?: string;
}

/** Domain → page → object (spec §25, §81). Derived from the route; records use their entity's page. */
export function useCrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const { byId } = useData();
  if (pathname === '/') return [{ label: 'Mission Control' }];
  const rec = /^\/record\/(.+)$/.exec(pathname);
  if (rec) {
    const r = byId.get(decodeURIComponent(rec[1]));
    const def = r ? ENTITY_BY_TYPE[r.entity] : undefined;
    const page = def?.route ? pageFor(def.route) : undefined;
    return [...(page ? [{ label: page.section.label, to: page.section.pages[0].to }, { label: page.label, to: page.to }] : def ? [{ label: def.plural, to: def.route }] : []), { label: r?.name ?? 'Record' }];
  }
  const studio = /^\/studio\/(.+)$/.exec(pathname);
  if (studio) {
    const r = byId.get(decodeURIComponent(studio[1]));
    return [{ label: 'Equipment Simulation', to: '/studio' }, { label: 'Simulation Studio', to: '/studio' }, { label: r?.name ?? 'Scenario' }];
  }
  const room = /^\/room\/(.+)$/.exec(pathname);
  if (room) {
    const r = byId.get(decodeURIComponent(room[1]));
    return [{ label: 'Work', to: '/pm' }, { label: 'Rooms', to: '/rooms' }, { label: r ? `${r.name} — room` : 'Room' }];
  }
  const page = pageFor(pathname);
  if (!page) return [{ label: 'Page' }];
  const out: Crumb[] = [{ label: page.section.label, to: page.section.pages[0].to !== page.to ? page.section.pages[0].to : undefined }, { label: page.label, to: pathname !== page.to ? page.to : undefined }];
  const rest = pathname.slice(page.to.length).split('/').filter(Boolean);
  if (rest.length) out.push({ label: decodeURIComponent(rest[rest.length - 1]).replace(/\.md$/, '').replace(/^\d+-/, '').replace(/-/g, ' ') });
  return out;
}

export function Breadcrumbs() {
  const crumbs = useCrumbs();
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-meta text-ink-3">
        <li className="shrink-0">
          <Link to="/" aria-label="Mission Control" className="grid size-7 place-items-center rounded-lg hover:bg-ink/5 hover:text-ink">
            <Home className="size-4" aria-hidden />
          </Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={i} className={i === crumbs.length - 1 ? 'min-w-0 flex-1' : i === 0 && crumbs.length > 2 ? 'hidden shrink-0 2xl:flex 2xl:items-center' : 'hidden shrink-0 xl:flex xl:items-center'}>
            <span className="flex min-w-0 items-center gap-1">
              <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />
              {c.to && i < crumbs.length - 1 ? (
                <Link to={c.to} className="rounded-md px-1 py-0.5 hover:bg-ink/5 hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={i === crumbs.length - 1 ? 'page' : undefined} className="truncate px-1 font-medium text-ink capitalize-first">
                  {c.label}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
