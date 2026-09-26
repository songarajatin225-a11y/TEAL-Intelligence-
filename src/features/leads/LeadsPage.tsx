import { Download, QrCode, UserPlus } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/badges';
import { recordPath } from '../../components/RecordLink';
import { Badge, Button, Card, EmptyState, Field, Input, Notice, PageHeader, Select, Textarea } from '../../components/ui';
import { PRIORITIES } from '../../domain/entities';
import { useData } from '../../hooks/useData';
import { newLocalId, repo, ValidationFailure } from '../../repositories';
import { buildLeadRecords, leadGroups, type LeadInput } from '../../services/leads';
import { addDays, fmtDate, relativeDay, todayIso } from '../../utils/dates';
import { download, stamp, toCsv } from '../../utils/export';

const NEW = '__new__';

/**
 * LEADCONNECT (ultimate spec §20): capture a lead at an exhibition in under a minute. One save
 * creates (atomically, as local drafts) the customer if new, a Lead-stage opportunity and a
 * follow-up activity — the same records the rest of the OS uses.
 */
export default function LeadsPage() {
  const { records } = useData();
  const today = todayIso();
  const customers = useMemo(() => records.filter((r) => r.entity === 'customer').sort((a, b) => a.name.localeCompare(b.name)), [records]);
  const products = useMemo(() => records.filter((r) => r.entity === 'product'), [records]);
  const applications = useMemo(() => records.filter((r) => r.entity === 'application'), [records]);
  const groups = useMemo(() => leadGroups(records), [records]);
  const events = groups.map((g) => g.event);

  const [event, setEvent] = useState(events[0] ?? '');
  const [customer, setCustomer] = useState(NEW);
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [product, setProduct] = useState('');
  const [application, setApplication] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<LeadInput['priority']>('Medium');
  const [followUp, setFollowUp] = useState(addDays(today, 3));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCustomer(NEW);
    setCompany('');
    setIndustry('');
    setLocation('');
    setContactName('');
    setContactRole('');
    setProduct('');
    setApplication('');
    setNotes('');
    setPriority('Medium');
    setFollowUp(addDays(today, 3));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const existing = customer !== NEW ? customers.find((c) => c.id === customer) : undefined;
    const companyName = existing?.name ?? company.trim();
    try {
      const recs = buildLeadRecords(
        { event, customerId: existing?.id, newCompany: company, industry, location, contactName, contactRole, productId: product, applicationId: application, notes, priority, followUp },
        { customer: newLocalId('customer'), opportunity: newLocalId('opportunity'), activity: newLocalId('activity') },
        companyName,
        today,
      );
      setBusy(true);
      await repo().workspace.saveMany(recs, `Lead captured at ${event.trim()}: ${companyName} · follow-up ${fmtDate(followUp)}`);
      reset();
    } catch (err) {
      setError(err instanceof ValidationFailure ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const exportEvent = (g: (typeof groups)[number]) =>
    download(
      `teal-leads-${g.tag.slice(6)}-${stamp()}.csv`,
      toCsv(
        g.leads.map(({ opportunity: o, followUp: f }) => ({
          company: records.find((r) => r.id === (o as { customer_id?: string }).customer_id)?.name ?? '',
          product: records.find((r) => r.id === (o as { product_id?: string }).product_id)?.name ?? '',
          stage: (o as { stage?: string }).stage ?? '',
          notes: (o as { inquiry_text?: string }).inquiry_text ?? '',
          follow_up: (f as { follow_up_date?: string } | undefined)?.follow_up_date ?? '',
          follow_up_status: (f as { status?: string } | undefined)?.status ?? '',
          opportunity_id: o.id,
        })),
      ),
      'text/csv',
    );

  return (
    <div className="space-y-5">
      <PageHeader title="LeadConnect" subtitle="Capture exhibition and event leads fast. Each lead becomes a customer, a Lead-stage opportunity and a follow-up — linked, dated and in your pipeline." />
      <Notice tone="warn">Contact names are personal data. They stay in this browser’s workspace; do not include them in a change package for this public repository (customer records are refused by default when a package is applied).</Notice>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <Card title="Capture a lead" icon={UserPlus} edge>
          <form onSubmit={(e) => void submit(e)} className="grid gap-3" aria-label="Capture a lead">
            <Field label="Event *" htmlFor="l-event" hint="Stays filled for the next lead">
              <Input id="l-event" list="l-events" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="e.g. productronica India 2026" required />
              <datalist id="l-events">
                {events.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </Field>
            <Field label="Customer *" htmlFor="l-cust">
              <Select id="l-cust" value={customer} onChange={(e) => setCustomer(e.target.value)}>
                <option value={NEW}>New company…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            {customer === NEW && (
              <>
                <Field label="Company name *" htmlFor="l-company">
                  <Input id="l-company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Industry" htmlFor="l-ind">
                    <Input id="l-ind" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </Field>
                  <Field label="Location" htmlFor="l-loc">
                    <Input id="l-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </Field>
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Contact" htmlFor="l-contact">
                <Input id="l-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Role" htmlFor="l-role">
                <Input id="l-role" value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Product of interest" htmlFor="l-prd">
                <Select id="l-prd" value={product} onChange={(e) => setProduct(e.target.value)}>
                  <option value="">—</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Application" htmlFor="l-app">
                <Select id="l-app" value={application} onChange={(e) => setApplication(e.target.value)}>
                  <option value="">—</option>
                  {applications.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="What they asked" htmlFor="l-notes" hint="Their words: part, material, rate, problem">
              <Textarea id="l-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Priority" htmlFor="l-pri">
                <Select id="l-pri" value={priority} onChange={(e) => setPriority(e.target.value as LeadInput['priority'])}>
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Follow up by *" htmlFor="l-fu">
                <Input id="l-fu" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} required />
              </Field>
            </div>
            {error && (
              <p role="alert" className="text-meta text-bad">
                Not saved — {error}
              </p>
            )}
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save lead (local draft)'}
            </Button>
          </form>
        </Card>

        <div className="min-w-0 space-y-4">
          {!groups.length ? (
            <EmptyState icon={QrCode} title="No leads captured yet" explain="Leads you capture appear here, grouped by event, with their follow-up status." compact />
          ) : (
            groups.map((g) => {
              const done = g.leads.filter((l) => (l.followUp as { status?: string } | undefined)?.status === 'Completed').length;
              const overdue = g.leads.filter((l) => {
                const f = l.followUp as { status?: string; follow_up_date?: string } | undefined;
                return f && f.status !== 'Completed' && f.follow_up_date && f.follow_up_date < today;
              }).length;
              return (
                <Card
                  key={g.tag}
                  title={g.event}
                  description={`${g.leads.length} lead${g.leads.length === 1 ? '' : 's'} · ${done} followed up${overdue ? ` · ${overdue} overdue` : ''}`}
                  actions={
                    <Button size="sm" onClick={() => exportEvent(g)}>
                      <Download className="size-3.5" aria-hidden /> CSV
                    </Button>
                  }
                >
                  <ul className="divide-y divide-line/60">
                    {g.leads.map(({ opportunity: o, followUp: f }) => {
                      const fu = f as { follow_up_date?: string; status?: string } | undefined;
                      return (
                        <li key={o.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2">
                          <Link to={recordPath(o.id)} className="min-w-0 flex-1 font-medium text-accent-2 hover:underline">
                            {o.name.replace(/ — .+ lead$/, '')}
                          </Link>
                          {(o as { product_id?: string }).product_id && <Badge>{records.find((r) => r.id === (o as { product_id?: string }).product_id)?.name}</Badge>}
                          <StatusBadge s={(o as { stage?: string }).stage} />
                          {fu && (
                            <Link to={recordPath(f!.id)} className={`text-micro ${fu.status !== 'Completed' && fu.follow_up_date && fu.follow_up_date < today ? 'text-bad' : 'text-ink-3'} hover:underline`}>
                              {fu.status === 'Completed' ? 'followed up' : `follow up ${relativeDay(fu.follow_up_date, today)}`}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
