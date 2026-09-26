import { ClipboardList } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Button, buttonClass, Card, Chain, Field, Input, Notice, PageHeader, Select } from '../../components/ui';
import { useData } from '../../hooks/useData';
import { newLocalId, repo, ValidationFailure } from '../../repositories';
import { buildCaptureRecords, CAPTURE_FIELDS } from '../../services/requirementCapture';
import { todayIso } from '../../utils/dates';

const NEW = '__new__';

/** CUSTOMER REQUIREMENT ENGINE (final master prompt §22): structured capture → URS → architecture → BOM → project. */
export default function CapturePage() {
  const { records } = useData();
  const customers = useMemo(() => records.filter((r) => r.entity === 'customer').sort((a, b) => a.name.localeCompare(b.name)), [records]);
  const industries = records.filter((r) => r.entity === 'industry');
  const apps = records.filter((r) => r.entity === 'application');
  const products = records.filter((r) => r.entity === 'product');
  const [customer, setCustomer] = useState(NEW);
  const [newCustomer, setNewCustomer] = useState('');
  const [industry, setIndustry] = useState('');
  const [part, setPart] = useState('');
  const [app, setApp] = useState('');
  const [product, setProduct] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ opp: string; reqs: number } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const oppId = newLocalId('opportunity');
      const recs = buildCaptureRecords(
        { customerId: customer === NEW ? undefined : customer, newCustomer, industry, customerProduct: part, applicationId: app, productId: product, currency, values },
        { customer: newLocalId('customer'), opportunity: oppId, requirement: () => newLocalId('requirement') },
        todayIso(),
      );
      await repo().workspace.saveMany(recs, `Captured ${recs.filter((r) => r.entity === 'requirement').length} customer requirement(s)`);
      setSaved({ opp: oppId, reqs: recs.filter((r) => r.entity === 'requirement').length });
      setValues({});
    } catch (err) {
      setError(err instanceof ValidationFailure ? err.message : (err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Requirement Capture" subtitle="Structured customer requirements. Each filled field becomes a URS requirement on one opportunity; acceptance criteria and verification methods are added next — never assumed." />
      <Chain
        label="Requirement to project"
        steps={[
          { label: 'Customer requirement', state: 'current' },
          { label: 'Engineering requirements', to: '/requirements' },
          { label: 'Product architecture', to: '/product-architecture' },
          { label: 'BOM', to: '/bom' },
          { label: 'Project', to: '/projects' },
        ]}
      />
      {saved && (
        <Notice tone="info">
          Saved {saved.reqs} requirement(s) as local drafts on a new opportunity.{' '}
          <Link to={recordPath(saved.opp)} className="font-medium text-accent-2 hover:underline">
            Open the opportunity
          </Link>{' '}
          · its Intelligence tab lists what is still missing.
        </Notice>
      )}
      <form onSubmit={(e) => void submit(e)} aria-label="Customer requirement" className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card title="Context" icon={ClipboardList} edge>
          <div className="grid gap-3">
            <Field label="Customer *" htmlFor="c-cust">
              <Select id="c-cust" value={customer} onChange={(e) => setCustomer(e.target.value)}>
                <option value={NEW}>New customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            {customer === NEW && (
              <Field label="Customer name *" htmlFor="c-new">
                <Input id="c-new" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} />
              </Field>
            )}
            <Field label="Industry" htmlFor="c-ind">
              <Select id="c-ind" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="">—</option>
                {industries.map((i) => (
                  <option key={i.id} value={i.name}>
                    {i.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Product (the customer’s part)" htmlFor="c-part">
              <Input id="c-part" value={part} onChange={(e) => setPart(e.target.value)} placeholder="e.g. QFN package, PCB panel, prismatic cell" />
            </Field>
            <Field label="Application" htmlFor="c-app">
              <Select id="c-app" value={app} onChange={(e) => setApp(e.target.value)}>
                <option value="">—</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="TEAL platform (if known)" htmlFor="c-prd">
              <Select id="c-prd" value={product} onChange={(e) => setProduct(e.target.value)}>
                <option value="">—</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
        <Card title="Requirements" description="Leave a field empty when the customer has not stated it — it stays UNKNOWN">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {CAPTURE_FIELDS.map((f) => (
              <Field key={f.key} label={`${f.label}${f.unit ? ` (${f.unit})` : ''}`} htmlFor={`c-${f.key}`} hint={f.hint}>
                <div className="flex gap-2">
                  <Input id={`c-${f.key}`} inputMode={f.numeric ? 'decimal' : undefined} value={values[f.key] ?? ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                  {f.key === 'target_cost' && (
                    <Select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-24">
                      {['INR', 'USD', 'EUR', 'JPY'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  )}
                </div>
              </Field>
            ))}
          </div>
          {error && (
            <p role="alert" className="mt-3 text-meta text-bad">
              Not saved — {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" variant="primary">
              Save requirements (local drafts)
            </Button>
            <Link to="/solution" className={buttonClass('secondary')}>
              Explore solutions in the Application engine
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
