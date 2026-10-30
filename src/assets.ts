import type { Asset } from './types';

export const assets: Asset[] = [
  {
    id: 'USDJPY', name: '米ドル / 日本円', ticker: 'USD / JPY',
    category: 'forex', currency: 'JPY', source: 'Frankfurter',
    sourceUrl: 'https://frankfurter.dev/',
    detail: '中央銀行由来の日次参考レート。時間足ではありません。',
    color: '#70e2ca'
  },
  {
    id: 'EURJPY', name: 'ユーロ / 日本円', ticker: 'EUR / JPY',
    category: 'forex', currency: 'JPY', source: 'Frankfurter',
    sourceUrl: 'https://frankfurter.dev/',
    detail: '中央銀行由来の日次参考レート。時間足ではありません。',
    color: '#76b7ff'
  },
  {
    id: 'BTCJPY', name: 'Bitcoin', ticker: 'BTC / JPY',
    category: 'crypto', currency: 'JPY', source: '要設定',
    detail: '公開利用を許諾された価格APIを接続すると1時間足で記録します。',
    color: '#efb85c'
  },
  {
    id: 'ETHJPY', name: 'Ethereum', ticker: 'ETH / JPY',
    category: 'crypto', currency: 'JPY', source: '要設定',
    detail: '公開利用を許諾された価格APIを接続すると1時間足で記録します。',
    color: '#b8a0ff'
  },
  {
    id: 'NIKKEI225', name: '日経平均株価', ticker: 'NIKKEI 225',
    category: 'index', currency: 'JPY', source: '要設定',
    sourceUrl: 'https://indexes.nikkei.co.jp/nkave/',
    detail: '指数データの公開・転載には提供元の利用許諾が必要です。',
    color: '#f08b7d'
  },
  {
    id: 'TOPIX', name: 'TOPIX', ticker: 'TOPIX',
    category: 'index', currency: 'JPY', source: '要設定',
    sourceUrl: 'https://www.jpx.co.jp/',
    detail: '指数データの公開・転載には提供元の利用許諾が必要です。',
    color: '#e6a1a1'
  },
  {
    id: 'SP500', name: 'S&P 500', ticker: 'S&P 500',
    category: 'index', currency: 'USD', source: '要設定',
    sourceUrl: 'https://www.spglobal.com/spdji/en/indices/equity/sp-500/',
    detail: '指数データの公開・転載には提供元の利用許諾が必要です。',
    color: '#80cfff'
  },
  {
    id: 'NASDAQ', name: 'NASDAQ Composite', ticker: 'NASDAQ',
    category: 'index', currency: 'USD', source: '要設定',
    sourceUrl: 'https://www.nasdaq.com/',
    detail: '指数データの公開・転載には提供元の利用許諾が必要です。',
    color: '#a9c2ef'
  }
];

export const categories = [
  { id: 'all', label: 'すべて' },
  { id: 'forex', label: '為替' },
  { id: 'crypto', label: '暗号資産' },
  { id: 'index', label: '株価指数' }
] as const;
