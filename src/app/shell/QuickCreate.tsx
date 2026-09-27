import {
  Briefcase,
  ClipboardCheck,
  Cpu,
  FileSearch,
  FlaskConical,
  GitBranch,
  Hammer,
  Layers,
  Lightbulb,
  ListChecks,
  Package,
  Plus,
  ShieldAlert,
  Sparkles,
  Truck,
  UserPlus,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EntityForm } from '../../components/EntityForm';
import { recordPath } from '../../components/RecordLink';
import { Button, Drawer, Popover } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';

/** Quick Create (spec §26): creation from anywhere, in a drawer, without leaving the page. */
export const CREATE_OPTIONS: { entity: string; label: string; icon: LucideIcon; to?: string; hint?: string }[] = [
  { entity: 'product', label: 'Product (from inquiry)', icon: Sparkles, to: '/inquiry', hint: 'Draft a full product package from a customer inquiry' },
  { entity: 'simulation', label: 'Equipment (simulation scenario)', icon: FlaskConical, to: '/studio?new=1', hint: 'From an equipment template, in the Simulation Studio' },
  { entity: 'part', label: 'Component (engineering database)', icon: Cpu },
  { entity: 'configuration', label: 'Machine configuration', icon: Layers, to: '/configurator' },
  { entity: 'project', label: 'Project', icon: Briefcase },
  { entity: 'opportunity', label: 'Opportunity', icon: Zap },
  { entity: 'lead', label: 'Event lead (LeadConnect)', icon: UserPlus, to: '/leads', hint: 'Customer + opportunity + follow-up in one step' },
  { entity: 'customer', label: 'Customer', icon: Users },
  { entity: 'requirement', label: 'Requirement', icon: ClipboardCheck },
  { entity: 'poc', label: 'POC', icon: FlaskConical },
  { entity: 'activity', label: 'Activity', icon: ListChecks },
  { entity: 'supplier', label: 'Supplier', icon: Truck },
  { entity: 'bom', label: 'BOM', icon: Package },
  { entity: 'rfq', label: 'RFQ', icon: FileSearch },
  { entity: 'risk', label: 'Risk', icon: ShieldAlert },
  { entity: 'decision', label: 'Decision', icon: GitBranch },
  { entity: 'change_request', label: 'Change request (ECR / ECO)', icon: Hammer },
  { entity: 'verification', label: 'Verification / validation', icon: ClipboardCheck },
  { entity: 'quality_record', label: 'NCR / CAPA / 8D', icon: ShieldAlert },
  { entity: 'lesson', label: 'Lesson learned', icon: Lightbulb },
];

export function QuickCreateMenu({ onPick }: { onPick: (entity: string) => void }) {
  return (
    <Popover
      label="Quick create"
      width="w-72"
      trigger={({ toggle, open, id }) => (
        <Button variant="primary" onClick={toggle} aria-expanded={open} aria-controls={id} aria-label="Quick create" className="px-3 sm:px-3.5">
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">New</span>
        </Button>
      )}
    >
      {(close) => (
        <div>
          <div className="px-2.5 pt-1.5 pb-1 text-micro font-medium text-ink-3">Create — saved as a local draft</div>
          <ul className="grid grid-cols-1">
            {CREATE_OPTIONS.map((o) => (
              <li key={o.entity}>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onPick(o.entity);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-ink/5"
                >
                  <o.icon className="size-4 shrink-0 text-accent-2" aria-hidden />
                  <span className="flex-1">{o.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-2.5 pt-1.5 pb-1 text-micro text-ink-3">
            Press <b>N</b> anywhere
          </div>
        </div>
      )}
    </Popover>
  );
}

export function QuickCreateDrawer({ entity, onClose }: { entity: string | null; onClose: () => void }) {
  const nav = useNavigate();
  const def = entity ? ENTITY_BY_TYPE[entity] : undefined;
  return (
    <Drawer open={!!entity && !!def} onClose={onClose} title={`New ${def?.label.toLowerCase() ?? ''}`} subtitle="Saved in this browser as a local draft. Export a change package to commit it." wide>
      {entity && def && (
        <EntityForm
          entity={entity}
          onCancel={onClose}
          onSaved={(r) => {
            onClose();
            nav(recordPath(r.id));
          }}
        />
      )}
    </Drawer>
  );
}
