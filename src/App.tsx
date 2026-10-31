import { useEffect, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts';
import { assets, categories } from './assets';
import PriceCard from './components/PriceCard';
import { approximateUsd, formatDate, formatUsd, formatValue, getChange, inRange, periods } from './pricing';
import type { Period } from './pricing';
import type { Category, PriceBook } from './types';

type CategoryFilter = Category | 'all';
const emptyBook: PriceBook = { version: 1, updatedAt: null, series: {} };

export default function App() {
  const [book, setBook] = useState<PriceBook>(emptyBook);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [selectedId, setSelectedId] = useState('USDJPY');
  const [period, setPeriod] = useState<Period>('30D');

  useEffect(() => {
    const controller = new AbortController();
    fetch(import.meta.env.BASE_URL + 'data/prices.json', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then((payload: PriceBook) => {
        if (payload.version !== 1 || !payload.series || typeof payload.series !== 'object') {
          throw new Error('価格データの形式が正しくありません');
        }
        setBook(payload);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'データ取得エラー');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const filteredAssets = assets.filter((asset) => filter === 'all' || asset.category === filter);
  const selected = assets.find((asset) => asset.id === selectedId) ?? assets[0];
  const allPoints = book.series[selected.id] ?? [];
  const points = inRange(allPoints, period);
  const latest = allPoints.at(-1);
  const usdEstimate = selected.category === 'crypto' ? approximateUsd(latest, book.series.USDJPY ?? []) : null;
  const change = getChange(points);
  const loadedCount = assets.filter((asset) => book.series[asset.id]?.length).length;
  const chartData = points.map((point) => ({ ...point, label: formatDate(point.at, period === '24H' || period === '7D') }));

  function selectCategory(category: CategoryFilter) {
    setFilter(category);
    const first = assets.find((asset) => category === 'all' || asset.category === category);
    if (first && category !== 'all') setSelectedId(first.id);
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-symbol">▥</span><span>MARKET<span className="brand-light">TRACKER</span></span></div>
      </header>

      <main>
        {error && <div className="error-banner" role="alert">価格データを読み込めませんでした：{error}</div>}
        <section aria-label="資産一覧">
          <div className="section-heading">
            <h1>マーケット一覧</h1>
            <div className="market-status">
              <span>最終更新：{loading ? '読み込み中…' : formatDate(book.updatedAt, true)}</span>
              <span>取得済み {loadedCount}/{assets.length} 銘柄</span>
            </div>
          </div>
          <div className="filter-row" role="group" aria-label="資産カテゴリー">
            {categories.map((category) => <button
              key={category.id} type="button"
              className={'filter-button ' + (filter === category.id ? 'active' : '')}
              aria-pressed={filter === category.id}
              onClick={() => selectCategory(category.id)}
            >{category.label}</button>)}
          </div>
          <div className="asset-grid">{filteredAssets.map((asset) => <PriceCard
            key={asset.id} asset={asset} points={book.series[asset.id] ?? []}
            fxPoints={book.series.USDJPY ?? []}
            selected={selectedId === asset.id}
            onSelect={() => setSelectedId(asset.id)}
          />)}</div>
        </section>

        <section className="chart-panel" aria-label="価格チャート">
          <div className="chart-heading">
            <div><span className="field-label">{selected.ticker} / PRICE HISTORY</span>
              <h2>{selected.name}</h2>
              <div className="large-price">{latest ? formatValue(latest.value, selected) : '—'} <small>{latest ? selected.currency : ''}</small></div>
              {usdEstimate && <div className="usd-estimate usd-estimate-detail">
                ≈ {formatUsd(usdEstimate.value)} <span>参考換算（ECB USD/JPY：{formatDate(usdEstimate.fxDate)}）</span>
              </div>}
              <div className={'change-text ' + (change === null ? 'muted' : change >= 0 ? 'positive' : 'negative')}>
                {change === null ? '選択期間の比較データはありません' : (change >= 0 ? '▲ +' : '▼ ') + change.toFixed(2) + '%（選択期間）'}
              </div>
            </div>
            <div className="period-row" role="group" aria-label="グラフ表示期間">
              {periods.map((item) => <button key={item} type="button"
                className={'period-button ' + (item === period ? 'active' : '')}
                aria-pressed={period === item} onClick={() => setPeriod(item)}>{item}</button>)}
            </div>
          </div>
          {chartData.length >= 2 ? (
            <div className="chart-wrap" role="img" aria-label={selected.name + ' の価格推移'}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 18, right: 12, bottom: 0, left: 8 }}>
                  <defs><linearGradient id="priceShade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={selected.color} stopOpacity={0.28}/>
                    <stop offset="95%" stopColor={selected.color} stopOpacity={0}/>
                  </linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="#25364b" strokeDasharray="4 6"/>
                  <XAxis dataKey="label" minTickGap={30} axisLine={false} tickLine={false} tick={{ fill: '#8c9bad', fontSize: 11 }}/>
                  <YAxis domain={['auto', 'auto']} width={66} axisLine={false} tickLine={false}
                    tick={{ fill: '#8c9bad', fontSize: 11 }}
                    tickFormatter={(value: number) => new Intl.NumberFormat('ja-JP', { notation: 'compact', maximumFractionDigits: 2 }).format(value)}/>
                  <Tooltip
                    contentStyle={{ background: '#121f31', border: '1px solid #304159', borderRadius: 12, color: '#f0f6ff' }}
                    labelStyle={{ color: '#9db0c5' }}
                    formatter={(value) => [formatValue(Number(value), selected) + ' ' + selected.currency, selected.ticker]}/>
                  <Area type="monotone" dataKey="value" stroke={selected.color} strokeWidth={2.5}
                    fill="url(#priceShade)" dot={false} activeDot={{ r: 5 }} isAnimationActive={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">
              <div className="empty-icon">⌁</div>
              <strong>{allPoints.length ? 'この期間のグラフを描くにはデータが足りません' : '価格データはまだありません'}</strong>
              <p>{allPoints.length ? '7D / 30D / ALL に切り替えてください。' : 'この銘柄は、利用可能なデータソースが接続されると表示されます。'}</p>
            </div>
          )}
          <div className="chart-footer">
            <span>出典：{selected.sourceUrl ? <a href={selected.sourceUrl} target="_blank" rel="noreferrer">{selected.source} ↗</a> : selected.source}</span>
            <span>直近の観測日：{formatDate(latest?.at, true)}</span>
          </div>
          <p className="source-note">{selected.detail}</p>
        </section>

        <section className="info-grid">
          <article className="info-panel"><span className="field-label">AUTOMATION</span>
            <h3>GitHub Actions で収集</h3>
            <p>毎時42分（日本時間）に取得を試みます。BTC・ETHは毎時の観測値、為替はECBの日次参考値を保存します。</p>
          </article>
          <article className="info-panel"><span className="field-label">DATA SOURCES</span>
            <h3>価格と取得頻度について</h3>
            <p>為替はECBの日次参考値、BTC・ETHはbitbankの毎時スナップショットです。株価指数はデータソース未接続です。</p>
          </article>
        </section>
        <p className="disclaimer">※ 本サイトは情報提供を目的とした試作ツールです。実際の約定価格ではなく、投資判断への利用を保証しません。価格取得には遅延・欠損が生じる場合があります。</p>
      </main>
      <footer><span>MARKET TRACKER</span><a href="https://github.com/naoiw/market-tracker" target="_blank" rel="noreferrer" className="repo-link">GitHub ↗</a></footer>
    </div>
  );
}
