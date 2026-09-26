export * from './common';
export * from './entities';
export * from './registry';

import type { z } from 'zod';
import type { baseShape } from './common';

/** The minimal shape every record satisfies (used by generic services). */
export type AnyRecord = z.infer<z.ZodObject<typeof baseShape>> & { entity: string } & Record<string, unknown>;
