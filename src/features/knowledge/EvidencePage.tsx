import { useState } from 'react';
import { Tabs } from '../../components/ui';
import { EntityListPage } from '../entities/EntityListPage';

/** EVIDENCE LEDGER (spec §19) + source registry. Every WHY? resolves to these records. */
export default function EvidencePage() {
  const [tab, setTab] = useState<'evidence' | 'sources'>('evidence');
  return (
    <div>
      <Tabs label="Ledger" value={tab} onChange={setTab} tabs={[{ key: 'evidence', label: 'Evidence' }, { key: 'sources', label: 'Sources' }]} />
      {tab === 'evidence' ? (
        <EntityListPage entity="evidence" title="Evidence ledger" intro="Claim · entity · source · document · section · excerpt · verification · confidence · reviewer. Evidence extracted from handbook tables is SOURCE_DOCUMENTED — not independently verified." />
      ) : (
        <EntityListPage entity="source" title="Source registry" intro="Every source the OS cites: the three handbooks, the legacy apps, the specification, and (later) curated datasheets and public datasets." />
      )}
    </div>
  );
}
