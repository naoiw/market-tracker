export const SUPPORTED_IDS = new Set([
  'USDJPY', 'EURJPY', 'BTCJPY', 'ETHJPY',
  'NIKKEI225', 'TOPIX', 'SP500', 'NASDAQ'
]);

export function normalizeSample(sample) {
  if (!SUPPORTED_IDS.has(sample?.id)) throw new Error('Unknown asset ID: ' + sample?.id);
  const value = Number(sample.value);
  if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid price for ' + sample.id);
  if (typeof sample.at !== 'string' || !Number.isFinite(Date.parse(sample.at))) {
    throw new Error('Invalid timestamp for ' + sample.id);
  }
  const iso = new Date(sample.at).toISOString();
  if (sample.interval === 'day') {
    if (!/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(iso)) {
      throw new Error('Daily samples must use midnight UTC');
    }
  } else if (sample.interval === 'hour') {
    if (!iso.endsWith(':00:00.000Z')) throw new Error('Hourly samples must use exact hour');
  } else {
    throw new Error('Invalid interval for ' + sample.id);
  }
  return { id: sample.id, at: iso, value };
}

export function parseAuthorizedFeed(payload, now = new Date()) {
  if (!payload || !Array.isArray(payload.prices)) throw new Error('Feed must have a prices array');
  const hour = new Date(now);
  hour.setUTCMinutes(0, 0, 0);
  return payload.prices.map((p) => {
    const interval = ['NIKKEI225', 'TOPIX', 'SP500', 'NASDAQ'].includes(p?.id) ? 'day' : 'hour';
    const stamp = new Date(p?.at);
    if (!Number.isFinite(stamp.getTime())) throw new Error('Invalid feed date');
    if (stamp.getTime() > now.getTime() + 5 * 60_000) throw new Error('Future feed date');
    if (now.getTime() - stamp.getTime() > 7 * 24 * 3600_000) throw new Error('Stale feed date');
    const at = interval === 'day'
      ? stamp.toISOString().slice(0, 10) + 'T00:00:00.000Z'
      : (stamp.setUTCMinutes(0, 0, 0), stamp.toISOString());
    if (interval === 'hour' && new Date(at).getTime() > hour.getTime()) throw new Error('Future hour');
    return normalizeSample({ id: p.id, at, value: p.value, interval });
  });
}

export function parseFrankfurterRates(rows) {
  if (!Array.isArray(rows)) throw new Error('Expected Frankfurter rates array');
  const dates = new Map();
  for (const row of rows) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row?.date)) continue;
    if (row.base !== 'EUR' || !['JPY', 'USD'].includes(row.quote)) continue;
    const n = Number(row.rate);
    if (!Number.isFinite(n) || n <= 0) continue;
    const existing = dates.get(row.date) ?? {};
    existing[row.quote] = n;
    dates.set(row.date, existing);
  }
  const samples = [];
  for (const [date, rates] of dates) {
    if (rates.USD && rates.JPY) {
      const at = date + 'T00:00:00.000Z';
      samples.push(normalizeSample({ id: 'EURJPY', at, value: rates.JPY, interval: 'day' }));
      samples.push(normalizeSample({ id: 'USDJPY', at, value: rates.JPY / rates.USD, interval: 'day' }));
    }
  }
  if (!samples.length) throw new Error('No valid currency pairs in response');
  return samples;
}


/**
 * Convert bitbank's public JPY tickers into hourly observations.
 * A ticker is a last executed trade, not a mid-price or a USD quote.
 * We intentionally do not invent observations for missing/stale symbols.
 */
const BITBANK_JPY_PAIRS = [
  ['btc_jpy', 'BTCJPY'],
  ['eth_jpy', 'ETHJPY']
];

export function parseBitbankTickers(payload, now = new Date()) {
  if (payload?.success !== 1 || !Array.isArray(payload.data)) {
    throw new Error('Unexpected bitbank tickers response');
  }
  const result = [];
  for (const [pair, id] of BITBANK_JPY_PAIRS) {
    const entry = payload.data.find((item) => item?.pair === pair);
    if (!entry) continue;
    const price = Number(entry.last);
    const stamp = Number(entry.timestamp);
    if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid bitbank price for ' + pair);
    if (!Number.isSafeInteger(stamp) || stamp <= 0 ||
        stamp > now.getTime() + 5 * 60_000 ||
        now.getTime() - stamp > 3 * 3600_000) {
      throw new Error('Missing or stale bitbank timestamp for ' + pair);
    }
    const at = new Date(Math.floor(stamp / 3600_000) * 3600_000).toISOString();
    result.push(normalizeSample({ id, at, value: price, interval: 'hour' }));
  }
  if (!result.length) throw new Error('No BTC/JPY or ETH/JPY ticker in bitbank response');
  return result;
}

const HISTORY_DAYS = 180;
const DAY_MS = 86400_000;

/**
 * Merge validated observations and trim the history of ALL assets, even when
 * a particular provider hasn't produced a new sample in this run.
 * Timestamps are the unique keys for each asset.
 */
export function mergePrices(book, incoming, now = new Date()) {
  if (book?.version !== 1 || !book?.series || Array.isArray(book.series) ||
      typeof book.series !== 'object') {
    throw new Error('Unrecognized price file schema');
  }

  const cutoff = now.getTime() - HISTORY_DAYS * DAY_MS;
  const series = {};
  let changed = false;

  for (const [id, existing] of Object.entries(book.series)) {
    if (!SUPPORTED_IDS.has(id) || !Array.isArray(existing)) {
      throw new Error('Invalid stored series for ' + id);
    }
    const kept = existing.filter((point) =>
      Number.isFinite(Date.parse(point?.at)) && Date.parse(point.at) >= cutoff
    );
    if (kept.length !== existing.length) changed = true;
    series[id] = new Map(kept.map(({ at, value }) => [at, value]));
  }

  for (const raw of incoming) {
    const sample = normalizeSample({
      ...raw,
      interval: raw.interval ?? (raw.at.endsWith('T00:00:00.000Z') ? 'day' : 'hour')
    });
    if (Date.parse(sample.at) < cutoff) continue;
    const observations = series[sample.id] ??= new Map();
    if (observations.get(sample.at) !== sample.value) {
      observations.set(sample.at, sample.value);
      changed = true;
    }
  }

  const sorted = {};
  for (const [id, observations] of Object.entries(series)) {
    sorted[id] = Array.from(observations, ([at, value]) => ({ at, value }))
      .sort((a, b) => a.at.localeCompare(b.at));
  }

  return {
    book: {
      version: 1,
      updatedAt: changed ? now.toISOString() : (book.updatedAt ?? null),
      series: sorted
    },
    changed
  };
}
