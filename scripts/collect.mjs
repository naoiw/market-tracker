import { readFile, writeFile } from 'node:fs/promises';
import { parseAuthorizedFeed, parseFrankfurterRates, parseBitbankTickers, mergePrices } from './price-utils.mjs';

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

// Providers run independently: a transient failure must not discard other prices.
const sources = [
  {
    name: 'ECB / Frankfurter',
    load: async () => {
      const firstRun = !(book.series.USDJPY?.length && book.series.EURJPY?.length);
      const from = new Date(now.getTime() - 90 * 86400_000).toISOString().slice(0, 10);
      const endpoint = firstRun
        ? 'https://api.frankfurter.dev/v2/rates?providers=ecb&base=EUR&quotes=JPY,USD&from=' + from
        : 'https://api.frankfurter.dev/v2/rates?providers=ecb&base=EUR&quotes=JPY,USD';
      return parseFrankfurterRates(await fetchJSON(endpoint));
    }
  },
  {
    name: 'bitbank',
    load: async () => parseBitbankTickers(
      await fetchJSON('https://public.bitbank.cc/tickers_jpy'), now
    )
  }
];

if (process.env.AUTHORIZED_PRICE_FEED_URL) {
  sources.push({
    name: 'Authorized feed',
    load: async () => {
      const url = new URL(process.env.AUTHORIZED_PRICE_FEED_URL);
      if (url.protocol !== 'https:') throw new Error('Authorized feed must use HTTPS');
      const headers = process.env.AUTHORIZED_PRICE_FEED_TOKEN
        ? { Authorization: 'Bearer ' + process.env.AUTHORIZED_PRICE_FEED_TOKEN }
        : {};
      return parseAuthorizedFeed(await fetchJSON(url.toString(), headers), now);
    }
  });
}

const results = await Promise.allSettled(sources.map((source) => source.load()));
const samples = [];
for (const [index, result] of results.entries()) {
  if (result.status === 'fulfilled') {
    samples.push(...result.value);
  } else {
    console.error(sources[index].name + ' unavailable:', result.reason);
  }
}
if (results.every((result) => result.status === 'rejected')) {
  throw new Error('All price sources failed');
}

// An approved intraday FX source supersedes ECB's daily reference for that ID.
// The authorized source is appended last so its observations take precedence.
const intradayIds = new Set(
  samples.filter((point) => !point.at.endsWith('T00:00:00.000Z')).map((point) => point.id)
);
const selectedSamples = samples.filter((point) =>
  !intradayIds.has(point.id) || !point.at.endsWith('T00:00:00.000Z')
);
const merged = mergePrices(book, selectedSamples, now);
if (merged.changed) {
  await writeFile(dataPath, JSON.stringify(merged.book, null, 2) + '\n');
  console.log('Saved ' + samples.length + ' samples at ' + merged.book.updatedAt);
} else {
  console.log('No new samples (market closed or same reporting period)');
}
