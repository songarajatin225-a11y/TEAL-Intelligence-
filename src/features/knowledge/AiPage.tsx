import { Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Card, Field, Notice, PageHeader, Select, Textarea } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import { buildContext, PROMPT_LIBRARY, renderPrompt } from '../../services/aiContext';

/** AI CONTEXT / PROMPT ENGINE (spec §83–§85). No AI API is called; no keys anywhere. */
export default function AiPage() {
  const { records, graph } = useData();
  const pickable = records.filter((r) => ['opportunity', 'project', 'poc', 'doe', 'configuration', 'product', 'cost_model', 'bom', 'customer', 'risk', 'supplier', 'rfq', 'localization', 'technology', 'requirement'].includes(r.entity));
  const [id, setId] = useState(pickable[0]?.id ?? '');
  const [tpl, setTpl] = useState('');
  const [copied, setCopied] = useState(false);
  const r = graph.byId.get(id);
  const ctx = useMemo(() => (id ? buildContext(graph, id) : ''), [graph, id]);
  const t = PROMPT_LIBRARY.find((x) => x.key === tpl);
  const text = t ? renderPrompt(t, ctx) : ctx;
  return (
    <div>
      <PageHeader eyebrow="Knowledge" title="AI context generator & prompt library" subtitle="Prepare structured, provenance-labelled context for Claude, ChatGPT or any assistant. The core platform does not depend on AI." />
      <Notice tone="info">No AI service is called from this site and no API key is stored in it. Copy the text and paste it into the assistant you are authorised to use. Do not paste confidential customer data into external tools unless your policy allows it.</Notice>
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[340px_1fr]">
        <Card title="Select">
          <div className="space-y-2">
            <Field label="Object" htmlFor="ai-obj">
              <Select id="ai-obj" value={id} onChange={(e) => setId(e.target.value)}>
                {pickable.map((p) => (
                  <option key={p.id} value={p.id}>
                    {ENTITY_BY_TYPE[p.entity]?.label}: {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prompt template" htmlFor="ai-tpl">
              <Select id="ai-tpl" value={tpl} onChange={(e) => setTpl(e.target.value)}>
                <option value="">Context only</option>
                {PROMPT_LIBRARY.map((p) => (
                  <option key={p.key} value={p.key} disabled={!!r && !p.appliesTo.includes(r.entity)}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  setCopied(false);
                }
              }}
            >
              <Copy className="size-3.5" /> {copied ? 'Copied' : 'Copy context'}
            </Button>
            <div className="text-meta text-ink-3">Templates: {PROMPT_LIBRARY.map((p) => p.title).join(' · ')}</div>
          </div>
        </Card>
        <Textarea aria-label="Generated context" readOnly value={text} className="h-[70vh] font-mono text-meta" />
      </div>
    </div>
  );
}
