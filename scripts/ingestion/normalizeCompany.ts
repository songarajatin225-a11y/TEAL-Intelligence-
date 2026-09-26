/**
 * NORMALIZE COMPANY (spec §23, §100): one company, one id — "IPG Photonics Corp.", "IPG PHOTONICS"
 * and "IPG Photonics Corporation" share the key `ipg-photonics`. Display names keep the source text.
 */
const LEGAL = /\b(incorporated|inc|corporation|corp|company|co|limited|ltd|private|pvt|gmbh|ag|kg|llc|llp|plc|sa|s\.a|nv|bv|srl|spa|oy|ab|as|kk|pte|pty|sas|sarl|holdings?)\b\.?/g;

export function companyKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[(),.'’"]/g, ' ')
    .replace(LEGAL, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const companyId = (name: string) => `co-${companyKey(name) || 'unknown'}`;

export function companyDisplayName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}
