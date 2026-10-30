import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSample, mergePrices, parseFrankfurterRates, parseAuthorizedFeed } from '../scripts/price-utils.mjs';

const empty = () => ({ version: 1, updatedAt: null, series: {} });

test('parses two currency pairs, including USD/JPY cross rate', () => {
  const points = parseFrankfurterRates([
    { date: '2026-10-29', base: 'EUR', quote: 'USD', rate: 1.2 },
    { date: '2026-10-29', base: 'EUR', quote: 'JPY', rate: 180 }
  ]);
  assert.equal(points.length, 2);
  assert.equal(points.find((p) => p.id === 'USDJPY').value, 150);
});

test('merge stores history in time order and is idempotent', () => {
  const now = new Date('2026-10-30T10:00:00Z');
  const samples = [
    { id: 'USDJPY', at: '2026-10-29T00:00:00.000Z', value: 149 },
    { id: 'USDJPY', at: '2026-10-28T00:00:00.000Z', value: 150 }
  ];
  const first = mergePrices(empty(), samples, now);
  assert.equal(first.changed, true);
  assert.deepEqual(first.book.series.USDJPY.map((p) => p.value), [150, 149]);
  assert.equal(mergePrices(first.book, samples, now).changed, false);
});

test('invalid negative, zero or nonfinite prices are rejected', () => {
  for (const value of [-1, 0, 'Infinity', 'oops']) {
    assert.throws(() => normalizeSample({ id: 'BTCJPY', at: '2026-10-30T10:00:00.000Z', value, interval: 'hour' }));
  }
});

test('approved feed normalizes hourly and daily timestamps', () => {
  const points = parseAuthorizedFeed({ prices: [
    { id: 'BTCJPY', at: '2026-10-30T09:25:00Z', value: 10000000 },
    { id: 'NIKKEI225', at: '2026-10-29T07:00:00Z', value: 42000 }
  ] }, new Date('2026-10-30T10:00:00Z'));
  assert.equal(points[0].at, '2026-10-30T09:00:00.000Z');
  assert.equal(points[1].at, '2026-10-29T00:00:00.000Z');
});

test('unknown assets and future readings are rejected', () => {
  assert.throws(() => parseAuthorizedFeed({ prices: [{ id: 'BAD', at: '2026-10-30', value: 5 }] }, new Date('2026-10-30T10:00:00Z')));
  assert.throws(() => parseAuthorizedFeed({ prices: [{ id: 'BTCJPY', at: '2026-10-31T10:00:00Z', value: 5 }] }, new Date('2026-10-30T10:00:00Z')));
});
