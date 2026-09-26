import { useMemo } from 'react';
import { useData } from '../hooks/useData';
import { Chain } from './ui';

/**
 * THE TEAL INTELLIGENCE NARRATIVE (final master prompt §55): market → … → commercialization, each
 * step with the number of records that carry it and a link to where it lives.
 */
export function BusinessStory() {
  const { records } = useData();
  const steps = useMemo(() => {
    const n = (...e: string[]) => records.filter((r) => e.includes(r.entity)).length;
    const opps = records.filter((r) => r.entity === 'opportunity');
    const productsDone = records.filter((r) => r.entity === 'product' && ['Product', 'Platform', 'Scale'].includes(String((r as { maturity?: string }).maturity ?? 'Product'))).length;
    return [
      { label: 'Market', sub: `${opps.filter((o) => (o as { market?: string }).market || (o as { market_size?: number | null }).market_size != null).length} sized`, to: '/business-case' },
      { label: 'Customer', sub: n('customer'), to: '/customers' },
      { label: 'Opportunity', sub: opps.length, to: '/opportunities' },
      { label: 'Technology', sub: n('technology'), to: '/technology' },
      { label: 'Application', sub: n('application'), to: '/solution' },
      { label: 'Product', sub: n('product'), to: '/products' },
      { label: 'Architecture', sub: n('configuration'), to: '/product-architecture' },
      { label: 'Supplier', sub: n('supplier'), to: '/suppliers' },
      { label: 'BOM', sub: n('bom'), to: '/bom' },
      { label: 'Cost', sub: n('cost_model'), to: '/cost' },
      { label: 'Localization', sub: n('localization'), to: '/localization' },
      { label: 'POC', sub: n('poc'), to: '/poc' },
      { label: 'Project', sub: n('project'), to: '/projects' },
      { label: 'Validation', sub: n('acceptance'), to: '/fat-sat' },
      { label: 'Commercial', sub: productsDone, to: '/value' },
    ].map((s) => ({ ...s, state: (s.sub === 0 ? 'todo' : 'done') as 'todo' | 'done' }));
  }, [records]);
  return <Chain label="TEAL Intelligence business flow" steps={steps} />;
}
