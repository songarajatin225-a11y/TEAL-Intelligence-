/**
 * CUSTOMER REQUIREMENT ENGINE (final master prompt §22). A structured capture form whose filled
 * fields become URS requirement records on one opportunity — then Engineering Requirements →
 * Product Architecture → BOM → Project continue in the existing engines. Nothing is filled in for
 * the customer: an empty field creates no requirement, and no requirement gets an invented
 * acceptance criterion or verification method (the gap engine then asks for them).
 */
export interface CaptureField {
  key: string;
  label: string;
  category: 'Functional' | 'Performance' | 'Process' | 'Quality' | 'Safety' | 'Interface' | 'Utility' | 'Regulatory' | 'Commercial' | 'Environment';
  unit?: string;
  hint?: string;
  numeric?: boolean;
}

/** The §22 fields that are requirements (Customer, Industry, Product, Application are context). */
export const CAPTURE_FIELDS: CaptureField[] = [
  { key: 'material', label: 'Material', category: 'Process', hint: 'e.g. epoxy mould compound, SS304, FR4' },
  { key: 'process', label: 'Process', category: 'Process', hint: 'e.g. marking, welding, depaneling' },
  { key: 'throughput', label: 'Throughput', category: 'Performance', unit: 'parts/h', numeric: true },
  { key: 'accuracy', label: 'Accuracy', category: 'Performance', unit: 'µm', numeric: true, hint: '± tolerance' },
  { key: 'quality', label: 'Quality', category: 'Quality', hint: 'grade, contrast, defects, Cpk' },
  { key: 'cycle_time', label: 'Cycle time', category: 'Performance', unit: 's', numeric: true },
  { key: 'footprint', label: 'Machine footprint', category: 'Environment', hint: 'L × W × H limit' },
  { key: 'automation', label: 'Automation', category: 'Functional', hint: 'manual, semi-automatic, inline, fully automatic' },
  { key: 'traceability', label: 'Traceability', category: 'Functional', hint: 'code type, reading, MES logging' },
  { key: 'communication', label: 'Communication', category: 'Interface', hint: 'SECS/GEM, OPC UA, Profinet, SMEMA…' },
  { key: 'safety', label: 'Safety', category: 'Safety', hint: 'laser class, standards' },
  { key: 'validation', label: 'Validation', category: 'Quality', hint: 'FAT / SAT / IQ-OQ-PQ expectations' },
  { key: 'target_cost', label: 'Target cost', category: 'Commercial', numeric: true, hint: 'the customer’s budget, with currency' },
  { key: 'timeline', label: 'Timeline', category: 'Commercial', hint: 'delivery expectation' },
];

export interface CaptureInput {
  customerId?: string;
  newCustomer?: string;
  industry?: string;
  customerProduct?: string;
  applicationId?: string;
  productId?: string;
  currency?: string;
  values: Record<string, string>;
}

export function buildCaptureRecords(input: CaptureInput, ids: { customer: string; opportunity: string; requirement: (i: number) => string }, today: string): Record<string, unknown>[] {
  if (!input.customerId && !input.newCustomer?.trim()) throw new Error('Choose a customer or enter the customer name.');
  const filled = CAPTURE_FIELDS.filter((f) => input.values[f.key]?.trim());
  if (!filled.length) throw new Error('Fill at least one requirement field.');
  const provenance = { verification_status: 'DRAFT', note: `Captured with the requirement engine on ${today}; values as stated by the customer, not yet signed off.` };
  const base = { data_type: 'USER_CREATED', provenance, created_at: today };
  const customerId = input.customerId ?? ids.customer;
  const customerName = input.newCustomer?.trim();
  const out: Record<string, unknown>[] = [];
  if (!input.customerId) out.push({ ...base, id: ids.customer, entity: 'customer', name: customerName, industry: input.industry || undefined });
  const title = [input.customerProduct, input.values.process].filter(Boolean).join(' — ') || 'Customer requirement';
  out.push({
    ...base,
    id: ids.opportunity,
    entity: 'opportunity',
    name: `${title}${customerName ? ` — ${customerName}` : ''}`,
    stage: 'Requirement',
    customer_id: customerId,
    industry: input.industry || undefined,
    application_id: input.applicationId || undefined,
    product_id: input.productId || undefined,
    value: null,
    probability: null,
    inquiry_text: [input.customerProduct && `Product: ${input.customerProduct}`, ...filled.map((f) => `${f.label}: ${input.values[f.key].trim()}${f.unit && f.numeric ? ` ${f.unit}` : ''}`)].filter(Boolean).join('\n'),
    next_action: { action: 'Add acceptance criteria and verification methods to the captured requirements (G0)', due: undefined },
  });
  filled.forEach((f, i) => {
    const raw = input.values[f.key].trim();
    out.push({
      ...base,
      id: ids.requirement(i),
      entity: 'requirement',
      name: `${f.label}: ${raw}${f.unit && f.numeric ? ` ${f.unit}` : ''}`,
      code: `URS-${String(i + 1).padStart(2, '0')}`,
      level: 'URS',
      category: f.category,
      value: raw,
      unit: f.key === 'target_cost' ? input.currency || undefined : f.unit,
      source: 'Customer statement (requirement capture)',
      priority: 'Must',
      opportunity_id: ids.opportunity,
      product_id: input.productId || undefined,
    });
  });
  return out;
}
