import { FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonClass, Card, KV } from '../../components/ui';
import type { Simulation } from '../../domain/engineering';
import type { Rec } from '../../hooks/useData';
import { studioPath } from '../studio/StudioPage';

/** A simulation scenario is worked on in the Studio; the record page links there. */
export default function SimulationRecordView({ record }: { record: Rec }) {
  const s = record as unknown as Simulation & Rec;
  return (
    <Card
      title="Equipment Simulation Studio"
      icon={FlaskConical}
      actions={
        <Link to={studioPath(s.id)} className={buttonClass('primary', 'sm')}>
          Open in the Studio
        </Link>
      }
    >
      <KV
        items={[
          ['Stations', s.stations.map((x) => x.name).join(' → ')],
          ['Components selected', String((s.selections ?? []).length)],
          ['Target UPH', s.targets?.uph != null ? String(s.targets.uph) : 'Not set'],
          ['Measured values', String((s.actuals ?? []).length)],
        ]}
      />
    </Card>
  );
}
