import type { AnyRecord } from '../domain';

/**
 * LEADCONNECT — exhibition / event lead capture (ultimate spec §20). A lead is not a new record
 * type: it is an Opportunity at stage "Lead" (tagged `lead` + `event:<slug>`), its Customer (new or
 * existing) and a follow-up Activity. Everything is a USER_CREATED local draft.
 */
export interface LeadInput {
  event: string;
  customerId?: string;
  newCompany?: string;
  industry?: string;
  location?: string;
  contactName?: string;
  contactRole?: string;
  productId?: string;
  applicationId?: string;
  notes?: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  followUp: string;
}

export const eventSlug = (event: string) =>
  event
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'event';

export const eventTag = (event: string) => `event:${eventSlug(event)}`;

export function buildLeadRecords(input: LeadInput, ids: { customer: string; opportunity: string; activity: string }, companyName: string, today: string): Record<string, unknown>[] {
  const event = input.event.trim();
  if (!event) throw new Error('Name the event where the lead was met.');
  if (!input.customerId && !input.newCompany?.trim()) throw new Error('Choose a customer or enter the company name.');
  const tags = ['lead', eventTag(event)];
  const provenance = { verification_status: 'DRAFT', note: `Captured at ${event} on ${today} (LeadConnect)` };
  const base = { data_type: 'USER_CREATED', provenance, created_at: today, tags };
  const customerId = input.customerId ?? ids.customer;
  const contact = input.contactName?.trim() ? [input.contactName.trim(), input.contactRole?.trim()].filter(Boolean).join(', ') : undefined;
  const out: Record<string, unknown>[] = [];
  if (!input.customerId) {
    out.push({
      ...base,
      id: ids.customer,
      entity: 'customer',
      name: input.newCompany!.trim(),
      industry: input.industry?.trim() || undefined,
      location: input.location?.trim() || undefined,
      contacts: input.contactName?.trim() ? [{ name: input.contactName.trim(), role: input.contactRole?.trim() || undefined }] : undefined,
    });
  }
  out.push({
    ...base,
    id: ids.opportunity,
    entity: 'opportunity',
    name: `${companyName} — ${event} lead`,
    stage: 'Lead',
    customer_id: customerId,
    product_id: input.productId || undefined,
    application_id: input.applicationId || undefined,
    industry: input.industry?.trim() || undefined,
    inquiry_text: input.notes?.trim() || undefined,
    value: null,
    probability: null,
    next_action: { action: `Follow up with ${companyName} after ${event}`, due: input.followUp },
  });
  out.push({
    ...base,
    id: ids.activity,
    entity: 'activity',
    name: `Follow up: ${companyName} (${event})`,
    kind: 'follow_up',
    status: 'Not Started',
    priority: input.priority,
    due_date: input.followUp,
    follow_up_date: input.followUp,
    customer_id: customerId,
    opportunity_id: ids.opportunity,
    product_id: input.productId || undefined,
    attendees: contact,
    description: input.notes?.trim() || undefined,
  });
  return out;
}

export interface LeadRow {
  opportunity: AnyRecord;
  followUp?: AnyRecord;
}
export interface EventGroup {
  tag: string;
  event: string;
  leads: LeadRow[];
}

/** Captured leads grouped by event, newest event first. */
export function leadGroups(records: AnyRecord[]): EventGroup[] {
  const opps = records.filter((r) => r.entity === 'opportunity' && (r.tags ?? []).includes('lead'));
  const acts = records.filter((r) => r.entity === 'activity');
  const groups = new Map<string, EventGroup>();
  for (const o of opps) {
    const tag = (o.tags ?? []).find((t) => t.startsWith('event:')) ?? 'event:unspecified';
    const event = /— (.+) lead$/.exec(o.name)?.[1] ?? tag.slice(6);
    const g = groups.get(tag) ?? groups.set(tag, { tag, event, leads: [] }).get(tag)!;
    g.leads.push({ opportunity: o, followUp: acts.find((a) => (a as { opportunity_id?: string }).opportunity_id === o.id && (a as { kind?: string }).kind === 'follow_up') });
  }
  return [...groups.values()].sort((a, b) => String(b.leads[0]?.opportunity.created_at ?? '').localeCompare(String(a.leads[0]?.opportunity.created_at ?? '')));
}
