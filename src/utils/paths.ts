/** Resolve a path under the deployed base (Vite `base`, e.g. /TEAL-Intelligence-/). */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export class FetchError extends Error {
  constructor(
    message: string,
    readonly url: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export async function fetchJson<T>(path: string): Promise<T> {
  const url = assetUrl(path);
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new FetchError(navigator.onLine ? `Could not reach ${path}` : `Offline and ${path} is not cached`, url);
  }
  if (!res.ok) throw new FetchError(`${path} returned HTTP ${res.status}`, url, res.status);
  return (await res.json()) as T;
}

export async function fetchText(path: string): Promise<string> {
  const url = assetUrl(path);
  const res = await fetch(url);
  if (!res.ok) throw new FetchError(`${path} returned HTTP ${res.status}`, url, res.status);
  return res.text();
}
