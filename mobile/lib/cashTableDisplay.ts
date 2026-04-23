import { formatCurrency } from '@/lib/utils';

export function formatCashTableBlinds(t: {
  blindType: string | null;
  sbValue: number | null;
  bbValue: number | null;
  btnValue: number | null;
}): string {
  if (t.blindType === 'button' && t.btnValue != null && t.btnValue > 0) {
    return `Button ${t.btnValue}`;
  }
  const sb = t.sbValue ?? 0;
  const bb = t.bbValue ?? 0;
  if (sb > 0 || bb > 0) return `${sb}/${bb}`;
  return '—';
}

export function formatCashTableBuyinRange(
  buyinMin: number | null | undefined,
  buyinMax: number | null | undefined
): string {
  const min = buyinMin ?? 0;
  const max = buyinMax ?? 0;
  if (min <= 0 && max <= 0) return '—';
  if (min > 0 && max > 0) return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  if (min > 0) return `a partir de ${formatCurrency(min)}`;
  return `até ${formatCurrency(max)}`;
}
