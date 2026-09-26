import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, PageHeader, Tabs } from '../../components/ui';
import { EntityListPage } from '../entities/EntityListPage';

/** Machines: configurations (designed machines) and serialized machines (spec §76). */
export default function MachinesPage() {
  const [tab, setTab] = useState<'configs' | 'fleet'>('configs');
  return (
    <div>
      <PageHeader title="Machines" subtitle="Designed machines (configurations) and the serialized machines delivered to customers." />
      <Tabs label="Machines" value={tab} onChange={setTab} tabs={[{ key: 'configs', label: 'Machine configurations' }, { key: 'fleet', label: 'Serialized machines' }]} />
      {tab === 'configs' ? (
        <EntityListPage
          embedded
          entity="configuration"
          title="Machine configurations"
          intro="Machines as configured in Configurator 2.0 — each opens its architecture, BOM and cost."
          createTo="/configurator"
          extraActions={
            <Link to="/architecture">
              <Button>Architecture canvas</Button>
            </Link>
          }
        />
      ) : (
        <EntityListPage embedded entity="machine" title="Serialized machines" intro="Every deployed machine: serial, customer, site, product, configuration, BOM revision, software/PLC version, FAT, SAT, commissioning, warranty, AMC, service. Machine records come from real deliveries — none are seeded. No real-time telemetry is claimed (digital-twin data architecture only)." />
      )}
    </div>
  );
}
