import { Maximize2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Drawer, IconButton } from '../../components/ui';
import { useData } from '../../hooks/useData';
import { pageContext } from '../../services/ai/context';
import { Copilot } from './Copilot';

/** Global Copilot drawer (header button, key I). Lazy-loaded: the AI layer costs nothing until opened. */
export default function CopilotDrawer({ open, onClose, query }: { open: boolean; onClose: () => void; query?: string }) {
  const { pathname } = useLocation();
  const { byId } = useData();
  const nav = useNavigate();
  const ctx = pageContext(pathname, byId);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      title={
        <span className="inline-flex items-center gap-2">
          TEAL Copilot <Badge tone="accent">BETA</Badge>
        </span>
      }
      subtitle="Industrial engineering copilot — grounded in TEAL records, engines and handbooks"
      actions={<IconButton label="Open the full Copilot page" icon={Maximize2} onClick={() => (onClose(), nav(ctx.id ? `/copilot?ctx=${encodeURIComponent(ctx.id)}` : '/copilot'))} />}
    >
      <Copilot key={query ?? ''} context={ctx.kind === 'none' ? null : ctx} mode="drawer" initialQuery={query} />
    </Drawer>
  );
}
