import { ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Notice, PageHeader } from '../../components/ui';
import { assetUrl } from '../../utils/paths';

const APPS = {
  'laser-simulator': {
    title: 'Laser Product Simulator',
    repo: 'teal-laser-product-sim-2',
    what: '3D machine configurator: 22 platforms, laser sources, f-theta objectives, automation modules, pricing and recommendations.',
    migrated: 'Platforms, sources, optics, materials, applications, modules, conflicts, rules and pricing are OS datasets; the configurator engine is ported with golden-fixture tests (Configurator, Products, Laser pages). The 3D view stays here — the OS opens it with the same URL hash.',
    changes: 'Cosmetic admin PIN removed.',
  },
  'cost-platform': {
    title: 'Cost Platform',
    repo: 'teal-cost-platform-2',
    what: 'Costing & estimation: 13 cost buckets, landed cost, markups, TEAL cost sheet, scenarios, approvals, masters.',
    migrated: 'Cost engine ported with golden-fixture tests (Cost page); masters migrated as DEMO item master, rates and suppliers; templates migrated as cost models. Your own projects import from Admin → Import from legacy apps.',
    changes: 'Seeded projects, audit trail and customer master emptied (they paired real customer names with illustrative jobs).',
  },
  'pm-tracker': {
    title: 'Product Management Tracker',
    repo: 'product-tracker-',
    what: 'Customers, applications, products, samples, meetings, activities, daily log, weekly review, localization, competitors, suppliers.',
    migrated: 'Vocabularies migrated; data maps to OS customers, opportunities, activities and POCs via Admin → Import from legacy apps (reads this app’s IndexedDB in the same browser).',
    changes: 'None.',
  },
} as const;
type AppKey = keyof typeof APPS;

/** LEGACY APPS (spec §7): kept working, unchanged, under /legacy/. */
export default function LegacyAppsPage() {
  const { app } = useParams();
  const key = app && app in APPS ? (app as AppKey) : null;
  if (key) {
    const a = APPS[key];
    const src = assetUrl(`legacy/${key}/index.html`);
    return (
      <div className="flex h-full flex-col gap-2">
        <PageHeader
          eyebrow={<Link to="/legacy">Legacy apps</Link>}
          title={a.title}
          subtitle="Running unchanged inside the OS. Data you enter here stays in this app’s own browser storage."
          actions={
            <a href={src} target="_blank" rel="noreferrer">
              <Button>
                <ExternalLink className="size-3.5" /> Open full window
              </Button>
            </a>
          }
        />
        <iframe title={a.title} src={src} className="min-h-[70vh] w-full flex-1 rounded-lg border border-line bg-panel" />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Admin" title="Legacy Applications" subtitle="The three original apps remain available. Their functionality is migrated into the OS step by step; see docs/02_LEGACY_FEATURE_MAP.md for the feature-by-feature status." />
      {app && <Notice tone="warn">No legacy app called “{app}”.</Notice>}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {(Object.keys(APPS) as AppKey[]).map((k) => {
          const a = APPS[k];
          return (
            <Card key={k} title={a.title}>
              <div className="space-y-2 text-body">
                <p>{a.what}</p>
                <p>
                  <span className="font-semibold">In the OS: </span>
                  {a.migrated}
                </p>
                <p className="text-ink-3">
                  Source: songarajatin225-a11y/{a.repo} · Changes in this copy: {a.changes}
                </p>
                <div className="flex gap-2">
                  <Link to={`/legacy/${k}`}>
                    <Button variant="primary">Open inside OS</Button>
                  </Link>
                  <a href={assetUrl(`legacy/${k}/index.html`)} target="_blank" rel="noreferrer">
                    <Button>
                      <ExternalLink className="size-3.5" /> New tab
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
