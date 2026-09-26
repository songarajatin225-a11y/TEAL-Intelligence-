import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Tabs } from '../../components/ui';
import { EntityListPage } from '../entities/EntityListPage';

/** Machines: configurations (designed machines) and serialized machines (spec §76). */
export default function MachinesPage() {
  const [tab, setTab] = useState<'configs' | 'fleet'>('configs');
  return (
    <div>
      <Tabs label="Machines" value={tab} onChange={setTab} tabs={[{ key: 'configs', label: 'Machine configurations' }, { key: 'fleet', label: 'Serialized machines' }]} />
      {tab === 'configs' ? (
        <EntityListPage
          entity="configuration"
          title="Machine configurations"
          intro="Machines as configured in Configurator 2.0 — each opens its architecture, BOM and cost."
          extraActions={
            <>
              <Link to="/configurator">
                <Button variant="primary">New configuration</Button>
              </Link>
              <Link to="/architecture">
                <Button>Architecture canvas</Button>
              </Link>
            </>
          }
        />
      ) : (
        <EntityListPage entity="machine" title="Machine serialization" intro="Every deployed machine: serial, customer, site, product, configuration, BOM revision, software/PLC version, FAT, SAT, commissioning, warranty, AMC, service. Machine records come from real deliveries — none are seeded. No real-time telemetry is claimed (digital-twin data architecture only)." />
      )}
    </div>
  );
}
