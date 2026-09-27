import { Info, Palette, Plug, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WORKSPACES } from '../../app/nav';
import { setPrefs, usePrefs } from '../../app/prefs';
import { AppearanceSettings } from '../../app/shell/Overlays';
import { Card, KV, Notice, PageHeader, SegmentedControl } from '../../components/ui';
import { providers, type SyncStatus } from '../../services/providers';
import { LockCard } from './AdminPage';
import { ModeToggle } from '../studio/shared';

/** SETTINGS (final master prompt §33, §38, §51): appearance, workspace, lock, providers and honest security limits. */
export default function SettingsPage() {
  const prefs = usePrefs();
  const [sync, setSync] = useState<SyncStatus | null>(null);
  useEffect(() => {
    void providers.sync.status().then(setSync);
  }, []);
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="How TEAL Intelligence looks and behaves in this browser, and what it can and cannot guarantee." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Appearance" icon={Palette}>
          <AppearanceSettings />
        </Card>
        <Card title="Workspace" description="Changes emphasis and navigation order — never data">
          <SegmentedControl label="Workspace" value={prefs.workspace} onChange={(workspace) => setPrefs({ workspace, openSections: {} })} options={WORKSPACES.map((w) => ({ value: w.id, label: w.label }))} />
          <p className="mt-2 text-meta text-ink-3">{WORKSPACES.find((w) => w.id === prefs.workspace)?.desc}</p>
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-1 text-meta font-medium">View mode</div>
            <ModeToggle />
            <p className="mt-2 text-meta text-ink-3">Customer mode hides internal cost, supplier identities, internal risks and notes in the Studio, the engineering database and reports — for presenting to a customer on this screen. It is a presentation setting, not access control.</p>
          </div>
        </Card>
      </div>
      <Card title="Providers" icon={Plug} description="The seams where a future backend can plug in without rebuilding the frontend">
        <KV
          items={[
            ['Data', 'Static master data from GitHub (catalog-driven) merged with this browser’s IndexedDB drafts'],
            ['Search', `${providers.search.kind} — prebuilt MiniSearch partitions + in-browser index of drafts`],
            ['Sync', `${providers.sync.describe()}${sync ? ` Current state: ${sync.state}.` : ''}`],
            ['Authentication', providers.auth.describe()],
          ]}
        />
      </Card>
      <Card title="Security — what this version does not do" icon={ShieldAlert}>
        <Notice tone="warn">This is a static GitHub Pages application. It has no server, no user accounts and no access control. Anyone with the URL sees the master data; anyone with this device can read its local drafts.</Notice>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-meta text-ink-2">
          <li>No API keys, tokens, passwords or credentials are stored in the code or the data.</li>
          <li>The LOCAL WORKSPACE LOCK is a convenience, not security.</li>
          <li>Never enter confidential customer data, NDA material, drawings, quotations or personal data you are not allowed to keep in this browser — and never commit them to this public repository.</li>
          <li>Permanent changes reach the repository only through a reviewed pull request.</li>
        </ul>
        <Link to="/help" className="mt-3 inline-block text-meta text-accent-2 hover:underline">
          Read more in Help
        </Link>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LockCard />
        <Card title="About" icon={Info}>
          <p className="text-body">
            <b>TEAL Intelligence</b> is TEAL’s digital Product Development and Technology Intelligence platform — connecting market opportunities, technology, applications, product architecture, suppliers, cost, localization and execution in one system.
          </p>
          <p className="mt-2 text-meta text-ink-3">It begins with Laser and is built to extend across Electronics, Semiconductor, Battery, Automation and Advanced Manufacturing — one reusable product-development intelligence OS, not a collection of tools.</p>
        </Card>
      </div>
    </div>
  );
}
