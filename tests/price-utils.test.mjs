import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSample, mergePrices, parseFrankfurterRates, parseAuthorizedFeed, parseBitbankTickers } from '../scripts/price-utils.mjs';

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

test('bitbank JPY ticker parses both symbols at UTC hourly timestamps', () => {
  const now = new Date('2026-10-30T10:30:00.000Z');
  const payload = { success: 1, data: [
    { pair: 'btc_jpy', last: '12345678', timestamp: Date.parse('2026-10-30T10:17:00Z') },
    { pair: 'eth_jpy', last: '650000', timestamp: Date.parse('2026-10-30T10:16:00Z') },
    { pair: 'xrp_jpy', last: '200', timestamp: Date.parse('2026-10-30T10:16:00Z') }
  ] };
  assert.deepEqual(parseBitbankTickers(payload, now), [
    { id: 'BTCJPY', at: '2026-10-30T10:00:00.000Z', value: 12345678 },
    { id: 'ETHJPY', at: '2026-10-30T10:00:00.000Z', value: 650000 }
  ]);
});

test('bitbank parser rejects invalid API responses and nonpositive prices', () => {
  const now = new Date('2026-10-30T10:30:00.000Z');
  assert.throws(() => parseBitbankTickers({ success: 0, data: [] }, now));
  assert.throws(() => parseBitbankTickers({ success: 1, data: [{ pair: 'btc_jpy', last: '0', timestamp: now.getTime() }] }, now));
});

test('bitbank parser rejects stale or future snapshots', () => {
  const now = new Date('2026-10-30T10:30:00.000Z');
  for (const timestamp of [Date.parse('2026-10-30T06:00:00Z'), Date.parse('2026-10-30T11:00:00Z')]) {
    assert.throws(() => parseBitbankTickers({ success: 1, data: [{ pair: 'eth_jpy', last: '1000', timestamp }] }, now));
  }
});

test('bitbank snapshot is idempotent when already collected for the hour', () => {
  const now = new Date('2026-10-30T10:30:00.000Z');
  const payload = { success: 1, data: [{ pair: 'btc_jpy', last: '12000000', timestamp: Date.parse('2026-10-30T10:17:00Z') }] };
  const parsed = parseBitbankTickers(payload, now);
  const first = mergePrices(empty(), parsed, now);
  assert.equal(first.changed, true);
  assert.equal(mergePrices(first.book, parsed, now).changed, false);
});

test('merging a different asset also prunes expired BTC/JPY history', () => {
  const now = new Date('2026-10-30T12:00:00Z');
  const existing = {
    version: 1, updatedAt: '2026-09-01T00:00:00Z',
    series: {
      BTCJPY: [
        { at: '2026-01-01T09:00:00.000Z', value: 100 },
        { at: '2026-10-29T09:00:00.000Z', value: 200 }
      ],
      EURJPY: [{ at: '2026-10-29T00:00:00.000Z', value: 175 }]
    }
  };
  const result = mergePrices(existing, [], now);
  assert.equal(result.changed, true);
  assert.deepEqual(result.book.series.BTCJPY, [
    { at: '2026-10-29T09:00:00.000Z', value: 200 }
  ]);
  assert.equal(result.book.updatedAt, now.toISOString());
  assert.deepEqual(existing.series.BTCJPY.length, 2); // Input is not mutated.
});

test('different hours including midnight UTC remain distinct observations', () => {
  const samples = [
    { id: 'BTCJPY', at: '2026-10-30T00:00:00.000Z', value: 100 },
    { id: 'BTCJPY', at: '2026-10-30T01:00:00.000Z', value: 110 }
  ];
  const now = new Date('2026-10-30T02:00:00Z');
  const result = mergePrices(empty(), samples, now);
  assert.equal(result.book.series.BTCJPY.length, 2);
  assert.equal(mergePrices(result.book, samples, now).changed, false);
});

test('rejects an invalid existing series instead of silently modifying public data', () => {
  assert.throws(() => mergePrices({ version: 1, updatedAt: null, series: { BTCJPY: {} } }, []));
});
