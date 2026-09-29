import type { SourceRef } from './types';

/*
 * AI GATEWAY (AI master prompt §4, §87–§89). The only door to language / embedding / vision models.
 *
 *   Frontend ──► AI gateway (server, holds keys) ──► model providers
 *
 * GitHub Pages has no server, so V1 ships the LocalGateway: it reports every remote capability as
 * unavailable and throws GatewayUnavailable if asked to complete — callers fall back to the local
 * engines. No provider key, endpoint or SDK is in this bundle. A RemoteGateway (spec in
 * docs/ai/AI_API_SPEC.md) implements the same interface against the organisation's own server; the
 * frontend would hold only a session token for that server, never a provider key.
 */

export type GatewayCapability = 'llm' | 'embedding' | 'rerank' | 'vision' | 'ocr';

export interface CompletionRequest {
  task: 'synthesize' | 'explain' | 'classify' | 'extract';
  /** model id from the registry (the gateway maps it to a provider model) */
  model: string;
  /** the question, never secrets */
  query: string;
  /** verified evidence bundle — the model may use only this */
  evidence: { source: SourceRef; text: string }[];
  /** JSON schema the answer must follow */
  schema?: Record<string, unknown>;
  maxTokens?: number;
}

export interface CompletionResponse {
  model: string;
  provider: string;
  /** structured output following the schema; free text is not accepted */
  output: unknown;
  usage?: { inputTokens: number; outputTokens: number };
  latencyMs: number;
}

export interface AIGateway {
  readonly kind: 'local' | 'remote';
  describe(): string;
  available(c: GatewayCapability): boolean;
  complete(req: CompletionRequest): Promise<CompletionResponse>;
}

export class GatewayUnavailable extends Error {
  constructor(what: string) {
    super(`${what}: no AI gateway is configured. This GitHub-only version runs the local engines; provider keys may only live on a server.`);
    this.name = 'GatewayUnavailable';
  }
}

export const LocalGateway: AIGateway = {
  kind: 'local',
  describe: () => 'Local engines only — no language, embedding or vision model is connected, and no provider key exists in this site.',
  available: () => false,
  complete: async (req) => {
    throw new GatewayUnavailable(`Model “${req.model}”`);
  },
};

let current: AIGateway = LocalGateway;
export const gateway = () => current;
/** Tests / a future private deployment only. The public build never calls this. */
export function setGateway(g: AIGateway) {
  current = g;
}

/** §87 — primary → fallback → database-only → graceful failure. */
export async function withFallback<T>(chain: { name: string; run: () => Promise<T> }[], onStep?: (name: string, ok: boolean, error?: string) => void): Promise<{ value: T; used: string }> {
  let last = '';
  for (const s of chain) {
    try {
      const value = await s.run();
      onStep?.(s.name, true);
      return { value, used: s.name };
    } catch (e) {
      last = e instanceof Error ? e.message : String(e);
      onStep?.(s.name, false, last);
    }
  }
  throw new Error(`All engines failed: ${last}`);
}
