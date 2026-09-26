import { describe, expect, it } from 'vitest';
import { convert, fmtNum, isKnownUnit, parseQuantity, UnitError } from '../../src/calculations/units';

describe('unit engine', () => {
  it('converts within a dimension', () => {
    expect(convert(1, 'kW', 'W')).toBe(1000);
    expect(convert(1064, 'nm', 'µm')).toBeCloseTo(1.064, 9);
    expect(convert(10.6, 'µm', 'nm')).toBeCloseTo(10600, 6);
    expect(convert(100, 'kHz', 'Hz')).toBe(100000);
    expect(convert(1, 'ns', 'ps')).toBeCloseTo(1000, 6);
    expect(convert(500, 'µJ', 'mJ')).toBeCloseTo(0.5, 9);
    expect(convert(1, 'm/s', 'mm/s')).toBe(1000);
    expect(convert(25, '°C', 'K')).toBeCloseTo(298.15, 6);
    expect(convert(1, 'kg', 'g')).toBe(1000);
    expect(convert(4, 'bar', 'kPa')).toBe(400);
  });
  it('refuses cross-dimension and currency conversion', () => {
    expect(() => convert(1, 'W', 'nm')).toThrow(UnitError);
    expect(() => convert(1, 'USD', 'INR')).toThrow(/FX/);
    expect(() => convert(1, 'furlong', 'm')).toThrow(/Unknown unit/);
  });
  it('parses quantities and keeps the original text', () => {
    expect(parseQuantity('50 W')).toEqual({ value: 50, unit: 'W', original: '50 W' });
    expect(parseQuantity('1064nm')?.unit).toBe('nm');
    expect(parseQuantity('10.6 µm')?.value).toBe(10.6);
    expect(parseQuantity('20–100 kHz')?.value).toBe(20);
    expect(parseQuantity('₹ 1,40,000')).toEqual({ value: 140000, unit: '₹', original: '₹ 1,40,000' });
    expect(parseQuantity('5 us')?.unit).toBe('µs');
    expect(parseQuantity('3 parsecs')).toBeNull();
  });
  it('knows the spec §87 units', () => {
    for (const u of ['W', 'kW', 'mW', 'nm', 'µm', 'mm', 'Hz', 'kHz', 'MHz', 'ns', 'ps', 'fs', 'J', 'mJ', 'µJ', 'mm/s', 'm/s', '°C', 'kg', 'g', '₹', '$', '€', '¥']) expect(isKnownUnit(u)).toBe(true);
  });
  it('formats unknowns as UNKNOWN', () => {
    expect(fmtNum(null)).toBe('UNKNOWN');
    expect(fmtNum(Number.NaN)).toBe('UNKNOWN');
  });
});
