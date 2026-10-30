import { readFile, writeFile } from 'node:fs/promises';
import { parseAuthorizedFeed, parseFrankfurterRates, mergePrices } from './price-utils.mjs';

const dataPath = new URL('../public/data/prices.json', import.meta.url);
const now = new Date();
const book = JSON.parse(await readFile(dataPath, 'utf8'));

async function fetchJSON(url, headers = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', ...headers },
        signal: AbortSignal.timeout(12000)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' from ' + new URL(url).origin);
      return await res.json();
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }
}

const tasks = [];
// Frankfurter publishes central-bank reference rates once per business day.
// Polling hourly does NOT make these intraday quotes.
tasks.push((async () => {
  const firstRun = !(book.series.USDJPY?.length && book.series.EURJPY?.length);
  const from = new Date(now.getTime() - 90 * 86400_000).toISOString().slice(0, 10);
  const endpoint = firstRun
    ? 'https://api.frankfurter.dev/v2/rates?base=EUR&quotes=JPY,USD&from=' + from
    : 'https://api.frankfurter.dev/v2/rates?base=EUR&quotes=JPY,USD';
  const rows = await fetchJSON(endpoint);
  return parseFrankfurterRates(rows);
})());

// User-supplied feed: only connect sources licensed for public data redistribution.
if (process.env.AUTHORIZED_PRICE_FEED_URL) {
  tasks.push((async () => {
    const url = new URL(process.env.AUTHORIZED_PRICE_FEED_URL);
    if (url.protocol !== 'https:') throw new Error('Authorized feed must use HTTPS');
    const headers = process.env.AUTHORIZED_PRICE_FEED_TOKEN
      ? { Authorization: 'Bearer ' + process.env.AUTHORIZED_PRICE_FEED_TOKEN }
      : {};
    return parseAuthorizedFeed(await fetchJSON(url.toString(), headers), now);
  })());
}

const results = await Promise.allSettled(tasks);
const samples = [];
for (const item of results) {
  if (item.status === 'fulfilled') samples.push(...item.value);
  else console.error('Price source unavailable:', item.reason);
}
if (results.every((x) => x.status === 'rejected')) {
  throw new Error('All price sources failed');
}

// An approved current FX source supersedes the daily reference series.
const liveIds = new Set(samples.filter((p) => !p.at.endsWith('T00:00:00.000Z')).map((p) => p.id));
const merged = mergePrices(book, samples.filter((p) => !liveIds.has(p.id) || !p.at.endsWith('T00:00:00.000Z')), now);
if (merged.changed) {
  await writeFile(dataPath, JSON.stringify(merged.book, null, 2) + '\n');
  console.log('Saved ' + samples.length + ' samples at ' + merged.book.updatedAt);
} else {
  console.log('No new samples (market closed or same reporting period)');
}
