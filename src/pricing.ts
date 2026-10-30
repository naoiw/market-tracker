import type { Asset, PricePoint } from './types';

export type Period = '24H' | '7D' | '30D' | '90D' | 'ALL';

export const periods: Period[] = ['24H', '7D', '30D', '90D', 'ALL'];

const durationMs: Record<Exclude<Period, 'ALL'>, number> = {
  '24H': 86400_000,
  '7D': 7 * 86400_000,
  '30D': 30 * 86400_000,
  '90D': 90 * 86400_000
};

export function formatValue(value: number, asset: Asset) {
  return new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: asset.category === 'forex' ? 3 : 2,
    minimumFractionDigits: asset.category === 'forex' ? 2 : 0
  }).format(value);
}

export function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return '未取得';
  const time = new Date(value);
  if (!Number.isFinite(time.getTime())) return '未取得';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(time);
}

export function inRange(points: PricePoint[], period: Period): PricePoint[] {
  if (period === 'ALL') return points;
  const threshold = Date.now() - durationMs[period];
  return points.filter((point) => Date.parse(point.at) >= threshold);
}

export function getChange(points: PricePoint[]) {
  if (points.length < 2 || points[0].value <= 0) return null;
  return ((points[points.length - 1].value / points[0].value) - 1) * 100;
}

export function approximateUsd(point: PricePoint | undefined, fxPoints: PricePoint[]) {
  if (!point) return null;
  const priceTime = Date.parse(point.at);
  // ECB quotes are daily reference values. Do not use future or stale rates.
  for (let i = fxPoints.length - 1; i >= 0; i--) {
    const rate = fxPoints[i];
    const lag = priceTime - Date.parse(rate.at);
    if (lag >= 0 && lag <= 5 * 86400_000 &&
        Number.isFinite(rate.value) && rate.value > 0) {
      return { value: point.value / rate.value, fxDate: rate.at };
    }
  }
  return null;
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}
