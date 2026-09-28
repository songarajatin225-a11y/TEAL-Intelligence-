import { describe, expect, it } from 'vitest';
import type { AnyRecord } from '../../src/domain';
import { allComponentSheets, itemProductType, parseSpecText } from '../../src/services/eng/componentDetail';
import { masterRecords } from '../helpers/repo';

describe('component datasheets (technical + supplier) on committed data', async () => {
  const records = await masterRecords();
  const byId = new Map(records.map((r) => [r.id, r as AnyRecord]));
  const sheets = allComponentSheets(records as AnyRecord[], byId);

  it('covers every component record in the platform', () => {
    const n = records.filter((r) => r.entity === 'component' || r.entity === 'part' || r.entity === 'module' || (r.entity === 'optic' && r.optic_type === 'f_theta') || (r.entity === 'laser_source' && r.kind === 'class')).length;
    expect(sheets.length).toBe(n);
    expect(sheets.filter((s) => s.source === 'Item master').length).toBe(58);
  });

  it('parses stated specification text without adding values, keeping every token', () => {
    const base = { source_id: 'src-x' };
    const r = parseSpecText('1064nm, 20W, pulse 4–200ns, air cooled', 'laser_source', base);
    expect(r.find((x) => x.spec === 'wavelength')).toMatchObject({ value: 1064, unit: 'nm', original: '1064nm', source_id: 'src-x' });
    expect(r.find((x) => x.spec === 'average_power')).toMatchObject({ value: 20, unit: 'W' });
    expect(r.find((x) => x.spec === 'pulse_width_range')).toMatchObject({ min: 4, max: 200, unit: 'ns' });
    expect(r.find((x) => x.spec === 'cooling_method')?.text).toBe('Air cooled');
    expect(parseSpecText('10.6µm, 30W', 'laser_source', base)[0]).toMatchObject({ spec: 'wavelength', value: 10600 });
    expect(parseSpecText('1064nm, EFL 160mm, field 110x110', 'f_theta', base).map((x) => x.spec)).toEqual(['wavelength', 'focal_length', 'scan_field_x', 'scan_field_y']);
    const odd = parseSpecText('frobnicated widget', 'other', base);
    expect(odd).toEqual([expect.objectContaining({ spec: 'other', text: 'frobnicated widget', original: 'frobnicated widget' })]);
  });

  it('recognises nearly all item-master specification tokens', () => {
    const items = sheets.filter((s) => s.source === 'Item master');
    const tokens = items.flatMap((s) => s.specs);
    const other = tokens.filter((t) => t.spec === 'other');
    expect(other.length / tokens.length).toBeLessThan(0.05);
    expect(items.every((s) => s.productType !== 'other')).toBe(true);
    expect(itemProductType({ name: 'Cobot UR10e', category: 'Robotics' })).toBe('robot');
  });

  it('links vendors to supplier and company records; missing facts stay unknown', () => {
    const ipg = sheets.find((s) => s.name === 'Fibre laser source 20W MOPA')!;
    expect(ipg.supplier.supplier?.id).toBe('sup-ipg-photonics');
    expect(ipg.supplier.company?.id).toBe('co-ipg-photonics');
    expect(ipg.missing).toContain('m2');
    const synrad = sheets.find((s) => s.name === 'CO2 laser tube 30W sealed')!;
    expect(synrad.supplier.supplier?.id).toBe('sup-synrad');
    expect(synrad.supplier.fields.find(([k]) => k === 'Country')?.[1]).toBeNull();
    // every item-master vendor now has a supplier record
    expect(sheets.filter((s) => s.source === 'Item master' && !s.supplier.supplier)).toEqual([]);
  });

  it('flags vendor assignments that do not fit the supplier category', () => {
    const chiller = sheets.find((s) => s.name === 'Chiller 6kW')!;
    expect(chiller.supplier.notes.some((n) => /verify the vendor assignment/.test(n))).toBe(false);
    const leak = sheets.find((s) => s.name === 'Helium leak detector')!;
    expect(leak.specs.some((s) => s.spec === 'sensor_type')).toBe(true);
  });
});
