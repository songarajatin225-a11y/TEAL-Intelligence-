export * from './common';
export * from './entities';
export * from './registry';

import type { z } from 'zod';
import type { baseShape } from './common';

/** The minimal shape every record satisfies (used by generic services). */
export type AnyRecord = {
  [K in keyof typeof baseShape]: z.infer<(typeof baseShape)[K]>;
} & { entity: string } & Record<string, unknown>;
