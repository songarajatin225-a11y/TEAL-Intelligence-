import type { AnyRecord } from '../../domain';
import { ENTITY_BY_TYPE } from '../../domain/registry';

/*
 * CONTEXT ENGINE (AI master prompt §8, §66). What the user is looking at becomes the Copilot's
 * context: a record page → that record (and its thread); a Studio scenario → the scenario. "Where can
 * I use this?" on a laser's page is answered for that laser. The user can always remove the context.
 */

export interface PageContext {
  kind: 'record' | 'scenario' | 'none';
  id?: string;
  entity?: string;
  name?: string;
  label: string;
  route: string;
}

export function pageContext(pathname: string, byId: Map<string, AnyRecord>): PageContext {
  const route = pathname;
  const rec = /^\/record\/([^/?#]+)/.exec(pathname);
  const sim = /^\/studio\/([^/?#]+)/.exec(pathname);
  const room = /^\/room\/([^/?#]+)/.exec(pathname);
  const id = rec ? decodeURIComponent(rec[1]) : sim ? decodeURIComponent(sim[1]) : room ? decodeURIComponent(room[1]) : undefined;
  const r = id ? byId.get(id) : undefined;
  if (!r) return { kind: 'none', label: 'No page context', route };
  return { kind: r.entity === 'simulation' ? 'scenario' : 'record', id: r.id, entity: r.entity, name: r.name, label: `${ENTITY_BY_TYPE[r.entity]?.label ?? r.entity}: ${r.name}`, route };
}
