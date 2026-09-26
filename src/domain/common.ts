import { z } from 'zod';

/* ------------------------------------------------------------------ enums */

/** Spec §17 — every record identifies what kind of data it is. Never mixed silently. */
export const DATA_TYPES = [
  'TEAL_INTERNAL',
  'PUBLIC',
  'EXTERNAL',
  'DEMO',
  'CALCULATED',
  'INFERRED',
  'AI_GENERATED',
  'USER_CREATED',
] as const;
export const DataType = z.enum(DATA_TYPES);
export type DataType = z.infer<typeof DataType>;

/** Spec §18 — verification states. */
export const VERIFICATION_STATUSES = [
  'VERIFIED',
  'SOURCE_DOCUMENTED',
  'CALCULATED',
  'INFERRED',
  'DRAFT',
  'ASSUMPTION',
  'UNKNOWN',
  'CONFLICTED',
  'STALE',
] as const;
export const VerificationStatus = z.enum(VERIFICATION_STATUSES);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const Confidence = z.enum(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']);
export type Confidence = z.infer<typeof Confidence>;

/** Knowledge-graph edge types (spec §80) plus a few thread-specific ones. */
export const EDGE_TYPES = [
  'manufactures',
  'uses',
  'compatible_with',
  'applies_to',
  'built_from',
  'supplied_by',
  'tested_by',
  'derived_from',
  'similar_to',
  'used_in',
  'requires',
  'validated_by',
  'learned_from',
  'belongs_to',
  'references',
  'evidence_for',
] as const;
export const EdgeType = z.enum(EDGE_TYPES);
export type EdgeType = z.infer<typeof EdgeType>;

/* ------------------------------------------------------------ primitives */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}([T ][\d:.]+Z?([+-]\d{2}:?\d{2})?)?$/, 'Expected ISO date (YYYY-MM-DD or ISO timestamp)');
export const IsoDate = isoDate;

/** Record ids: lower-case prefix, hyphen, then [a-z0-9._-]. e.g. `prd-markf`, `cus-L2k9x0a` */
export const RecordId = z
  .string()
  .regex(/^[a-z]{2,6}-[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Expected id like "prd-markf" (prefix-slug)');

/**
 * A physical quantity that keeps the source's original text (spec §87 — never destroy
 * original source units). `value` is normalised to `unit`; `original` is as published.
 */
export const Quantity = z.object({
  value: z.number().nullable(),
  unit: z.string(),
  original: z.string().optional(),
  status: VerificationStatus.optional(),
});
export type Quantity = z.infer<typeof Quantity>;

export const Provenance = z.object({
  source_id: z.string().optional(),
  source_url: z.string().url().optional(),
  document: z.string().optional(),
  section: z.string().optional(),
  page: z.string().optional(),
  retrieved_at: isoDate.optional(),
  last_verified: isoDate.optional(),
  verification_status: VerificationStatus,
  confidence: Confidence.optional(),
  note: z.string().optional(),
});
export type Provenance = z.infer<typeof Provenance>;

export const Link = z.object({
  rel: EdgeType,
  target: z.string(),
  note: z.string().optional(),
});
export type Link = z.infer<typeof Link>;

export const NextAction = z.object({
  action: z.string().min(1),
  due: isoDate.optional(),
  owner: z.string().optional(),
});
export type NextAction = z.infer<typeof NextAction>;

/** Fields every record carries. Entity schemas extend this. */
export const baseShape = {
  id: RecordId,
  name: z.string().min(1),
  description: z.string().optional(),
  data_type: DataType,
  provenance: Provenance,
  tags: z.array(z.string()).optional(),
  links: z.array(Link).optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  next_action: NextAction.optional(),
  created_at: isoDate.optional(),
  updated_at: isoDate.optional(),
  version: z.number().int().positive().optional(),
  notes: z.string().optional(),
};

/* ------------------------------------------------------------- datasets */

export const DatasetHeader = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9._-]*$/),
  title: z.string(),
  description: z.string(),
  entity: z.string(),
  version: z.string(),
  last_updated: isoDate,
  data_type: DataType,
  source_ids: z.array(z.string()),
  source_version: z.string().optional(),
  partition: z.string().optional(),
  notes: z.string().optional(),
});
export type DatasetHeader = z.infer<typeof DatasetHeader>;
