import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Tabs } from '../../components/ui';
import { EntityListPage } from '../entities/EntityListPage';

/** LASER INTELLIGENCE (spec §25): TEAL source classes + curated manufacturer products. */
export default function LaserPage() {
  const [tab, setTab] = useState<'class' | 'product'>('class');
  return (
    <div>
      <PageHeader title="Laser Sources" subtitle="Source technologies offered by TEAL platforms, and manufacturer models once curated. Class parameters are representative — not datasheets." />
      <Tabs
        label="Laser database"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'class', label: 'TEAL source classes' },
          { key: 'product', label: 'Manufacturer products' },
        ]}
      />
      {tab === 'class' ? (
        <EntityListPage embedded entity="laser_source" title="TEAL source classes" filter={(r) => (r as { kind?: string }).kind === 'class'} intro="The 12 source technologies the TEAL configurator offers, with representative parameters for diffraction-limited estimates. Not datasheets." />
      ) : (
        <EntityListPage
          embedded
          entity="laser_source"
          title="Manufacturer products"
          filter={(r) => (r as { kind?: string }).kind === 'product'}
          intro={
            <>
              Specific models with manufacturer, datasheet and verification. None are curated in the repository yet — manufacturer data enters only through the reviewed ingestion pipeline (see <Link className="text-accent-2 underline" to="/global">Global Intelligence</Link>). Products imported from your legacy tracker appear here as local drafts.
            </>
          }
        />
      )}
    </div>
  );
}
