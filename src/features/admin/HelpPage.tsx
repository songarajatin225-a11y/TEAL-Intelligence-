import { BookOpen, Keyboard, Layers, Route, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GLOSSARY, HELP } from '../../app/help';
import { ALL_PAGES, SECTIONS, WORKSPACES } from '../../app/nav';
import { useShell } from '../../app/shell/ShellContext';
import { SHORTCUTS } from '../../app/shell/shortcuts';
import { Button, Card, Kbd, PageHeader } from '../../components/ui';

/** HELP CENTER (spec §98): concepts, workspaces, workflows, shortcuts, glossary. */
export default function HelpPage() {
  const shell = useShell();
  const workflows = Object.entries(HELP).filter(([, h]) => h.workflow);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Help Center"
        subtitle="How TEAL Intelligence is organised, how to get work done, and what the labels mean."
        actions={
          <>
            <Button onClick={shell.openOnboarding}>
              <Sparkles className="size-4" aria-hidden /> Welcome tour
            </Button>
            <Button onClick={shell.openShortcuts}>
              <Keyboard className="size-4" aria-hidden /> Shortcuts
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Three ideas" icon={Sparkles}>
          <ol className="list-decimal space-y-2 pl-5 text-ink-2">
            <li>
              <b className="text-ink">Everything is connected.</b> Records form one digital thread from inquiry to lessons learned.
            </li>
            <li>
              <b className="text-ink">Start from the task.</b> Mission Control, search (<Kbd>/</Kbd>) and the command palette (<Kbd>⌘</Kbd> <Kbd>K</Kbd>) get you anywhere.
            </li>
            <li>
              <b className="text-ink">Depth on demand.</b> Records open with essentials; evidence, formulas and raw fields are one tab away.
            </li>
          </ol>
        </Card>
        <Card title="Your data" icon={ShieldCheck}>
          <p className="text-ink-2">Master data comes from the GitHub repository. Anything you create or edit is a <b className="text-ink">local draft</b> stored only in this browser. Export a change package from Data Manager to propose it for the repository.</p>
          <Link to="/admin" className="mt-2 inline-block font-medium text-accent-2 hover:underline">
            Data Manager →
          </Link>
        </Card>
        <Card title="Workspaces" icon={Layers} description="Change emphasis, never data">
          <ul className="space-y-1.5">
            {WORKSPACES.map((w) => (
              <li key={w.id} className="flex gap-2">
                <w.icon className="mt-0.5 size-4 shrink-0 text-accent-2" aria-hidden />
                <span>
                  <b>{w.label}</b> <span className="text-meta text-ink-3">— {w.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Where things live" icon={Route} description={`${SECTIONS.length} domains, ${ALL_PAGES.length} pages`}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-5">
          {SECTIONS.map((s) => (
            <div key={s.id}>
              <div className="mb-1 flex items-center gap-1.5 text-meta font-semibold uppercase tracking-[0.06em] text-ink-3">
                <s.icon className="size-4" aria-hidden /> {s.label}
              </div>
              <ul className="space-y-0.5">
                {s.pages.map((p) => (
                  <li key={p.to}>
                    <Link to={p.to} className="text-body hover:text-accent-2 hover:underline" title={p.desc}>
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Typical workflows" icon={BookOpen}>
          <div className="space-y-4">
            {workflows.map(([route, h]) => (
              <div key={route}>
                <Link to={route} className="font-semibold hover:text-accent-2">
                  {ALL_PAGES.find((p) => p.to === route)?.label ?? route}
                </Link>
                <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-meta text-ink-2">
                  {h.workflow!.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <Card title="Glossary">
            <dl className="space-y-2">
              {GLOSSARY.map(([t, d]) => (
                <div key={t}>
                  <dt className="font-medium">{t}</dt>
                  <dd className="text-meta text-ink-2">{d}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Keyboard" icon={Keyboard}>
            <ul className="space-y-1.5">
              {SHORTCUTS.slice(0, 8).map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 text-meta">
                  <span className="text-ink-2">{s.label}</span>
                  <span className="flex gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
