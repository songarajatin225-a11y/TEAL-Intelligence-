import { Play, Save, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '../../components/toast';
import { Badge, Button, Card, Chain, Field, Notice, PageHeader, Tabs, Textarea } from '../../components/ui';
import { repo } from '../../repositories';
import { REQUIREMENT_FIELDS } from '../../services/ai/agents';
import { configure, type ConfigureResult } from '../../services/ai/configure';
import { fmeaDraft, REVIEW_BANNER, rfqDraft, ursDraft } from '../../services/ai/drafts';
import { runCopilot } from '../../services/ai/orchestrator';
import type { EngineeringAnswer } from '../../services/ai/types';
import { AnswerView } from './AnswerView';
import { useCopilotDeps } from './useCopilotDeps';

/*
 * AI PRODUCT CONFIGURATOR (AI master prompt §20, §76, §104). Requirement text → every stage of the
 * configuration, inspectable: extraction, technology candidates, platform, architecture, BOM,
 * components, compatibility, suppliers, cost, 3D scenario, RFQ / URS / FMEA drafts. Edit the
 * requirement and run again; save the package as local drafts only when you choose to.
 */

const EXAMPLE = 'I need a laser marking machine for aluminium battery cans, 5-second cycle time, high-contrast marking, inline with MES traceability.';
type DraftKey = 'rfq' | 'urs' | 'fmea';

export default function ConfiguratorPage() {
  const [params, setParams] = useSearchParams();
  const deps = useCopilotDeps();
  const nav = useNavigate();
  const q = params.get('q') ?? '';
  const [text, setText] = useState(q || EXAMPLE);
  const [answer, setAnswer] = useState<EngineeringAnswer | null>(null);
  const [cfg, setCfg] = useState<ConfigureResult | null>(null);
  const [draftTab, setDraftTab] = useState<DraftKey>('rfq');
  const [drafts, setDrafts] = useState<Record<DraftKey, string>>({ rfq: '', urs: '', fmea: '' });

  useEffect(() => {
    if (!deps || !q) return;
    let live = true;
    const c = configure(q, { records: deps.records, engine: deps.engine, lexicon: deps.lexicon, compat: deps.compat, newId: deps.newId });
    void runCopilot(q, null, deps, 'configure').then((a) => {
      if (!live) return;
      setCfg(c);
      setAnswer(a);
      setDrafts({ rfq: rfqDraft(c).markdown, urs: ursDraft(c).markdown, fmea: fmeaDraft(c).markdown });
    });
    return () => {
      live = false;
    };
  }, [q, deps]);

  const stages = useMemo(() => {
    if (!cfg) return [];
    const st = (ok: boolean, gapOk = false) => (ok ? ('done' as const) : gapOk ? ('current' as const) : ('gap' as const));
    return [
      { label: 'Requirements', sub: `${REQUIREMENT_FIELDS.filter((k) => cfg.req[k].status !== 'NOT DEFINED').length}/${REQUIREMENT_FIELDS.length} read`, state: st(cfg.req.missing.length < 6, true) },
      { label: 'Technology', sub: `${cfg.lasers.length} candidates`, state: st(cfg.lasers.length > 0) },
      { label: 'Platform', sub: cfg.pkg?.matches[0]?.product.name ?? 'none', state: st(!!cfg.pkg?.matches.length) },
      { label: 'Architecture', sub: cfg.solution ? `${cfg.solution.subsystems.length} layers` : '—', state: st(!!cfg.solution) },
      { label: 'BOM', sub: `${cfg.pkg?.bom?.lines.length ?? 0} lines`, state: st(!!cfg.pkg?.bom?.lines.length) },
      { label: 'Components', sub: `${cfg.components.filter((c) => c.parts.length).length}/${cfg.components.length} roles`, state: st(cfg.components.some((c) => c.parts.length)) },
      { label: 'Compatibility', sub: `${cfg.compat.length} pairs`, state: st(!cfg.compat.some((c) => c.relationship === 'Incompatible'), true) },
      { label: 'Cost', sub: cfg.cost.band ? 'price band' : 'unknown', state: st(!!cfg.cost.band) },
      { label: '3D', sub: cfg.templates[0]?.template.name ?? 'no template', state: st(cfg.templates.length > 0) },
      { label: 'RFQ / URS', sub: 'drafts', state: 'current' as const },
    ];
  }, [cfg]);

  const savePackage = async () => {
    if (!cfg?.pkg) return;
    const recs = cfg.pkg.records.map((r) => ({ ...r, tags: [...new Set([...(r.tags ?? []), 'ai-assisted'])] }));
    await repo().workspace.saveMany(recs as unknown as Record<string, unknown>[], `AI Configurator package (${recs.length} drafts)`);
    toast('Package saved as local drafts', { tone: 'draft', detail: `${recs.length} INFERRED / DRAFT records — engineering review required.` });
    nav(`/record/${encodeURIComponent(cfg.pkg.opportunity.id)}`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Products"
        title={
          <span className="inline-flex items-center gap-2">
            AI Product Configurator <Badge tone="accent">BETA</Badge>
          </span>
        }
        subtitle="Requirement → technology → architecture → components → BOM → suppliers → cost → 3D → RFQ / URS. Every stage shows its basis; nothing unknown is filled in."
      />
      <Card title="Customer requirement" icon={Wand2}>
        <div className="space-y-2">
          <Field label="Requirement (paste an inquiry or RFQ text)" htmlFor="aic-text">
            <Textarea id="aic-text" value={text} onChange={(e) => setText(e.target.value)} className="h-24" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={!text.trim() || !deps} onClick={() => setParams({ q: text.trim() })}>
              <Play className="size-4" aria-hidden /> Configure
            </Button>
            <Button onClick={() => setText(EXAMPLE)}>Example</Button>
          </div>
        </div>
      </Card>
      {!q && <Notice tone="info">Describe the application, material, part, cycle time and quality. The configurator reads what is stated, marks everything else Not Defined and asks for it.</Notice>}
      {q && !answer && <p className="text-meta text-ink-3">Configuring…</p>}
      {answer && cfg && (
        <>
          <Chain label="Configuration stages" steps={stages} />
          <Card>
            <AnswerView a={answer} onAsk={(x) => nav(`/copilot?q=${encodeURIComponent(x)}`)} />
          </Card>
          <Card
            title="Documents"
            description="Editable drafts built from the requirement and the configuration"
            actions={
              cfg.pkg ? (
                <Button size="sm" onClick={() => void savePackage()}>
                  <Save className="size-3.5" aria-hidden /> Save package as drafts
                </Button>
              ) : undefined
            }
          >
            <div className="space-y-2">
              <Tabs<DraftKey> label="Draft documents" value={draftTab} onChange={setDraftTab} tabs={[{ key: 'rfq', label: 'RFQ' }, { key: 'urs', label: 'URS' }, { key: 'fmea', label: 'FMEA (AI-suggested)' }]} />
              <Badge tone="draft">{REVIEW_BANNER}</Badge>
              <Textarea aria-label={`${draftTab.toUpperCase()} draft`} value={drafts[draftTab]} onChange={(e) => setDrafts((d) => ({ ...d, [draftTab]: e.target.value }))} className="h-96 font-mono text-micro" />
              <Button
                size="sm"
                onClick={() => {
                  const url = URL.createObjectURL(new Blob([drafts[draftTab]], { type: 'text/markdown' }));
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${draftTab}-draft.md`;
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                Download .md
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
