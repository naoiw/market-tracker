import type { Asset, PricePoint } from '../types';
import { approximateUsd, formatDate, formatUsd, formatValue, getChange } from '../pricing';

export default function PriceCard({
  asset, points, fxPoints, selected, onSelect
}: { asset: Asset; points: PricePoint[]; fxPoints: PricePoint[]; selected: boolean; onSelect: () => void }) {
  const latest = points.at(-1);
  const usd = asset.category === 'crypto' ? approximateUsd(latest, fxPoints) : null;
  const change = getChange(points.slice(-2));
  return (
    <button type="button" className={'asset-card ' + (selected ? 'selected' : '')} onClick={onSelect}>
      <span className="asset-top"><span className="ticker">{asset.ticker}</span><span className={'status-dot ' + (latest ? 'available' : '')}/></span>
      <span className="asset-name">{asset.name}</span>
      <span className="asset-price">{latest ? formatValue(latest.value, asset) : '—'} <small>{latest ? asset.currency : ''}</small></span>
      {usd && <span className="usd-estimate">≈ {formatUsd(usd.value)} <span>参考換算</span></span>}
      <span className="asset-bottom">
        <span className={change === null ? 'muted' : change >= 0 ? 'positive' : 'negative'}>
          {change === null ? (latest ? '比較データなし' : (asset.category === 'crypto' ? '価格未取得' : 'データ未接続')) : (change >= 0 ? '+' : '') + change.toFixed(2) + '%'}
        </span>
        <span className="muted">{latest ? formatDate(latest.at, true) : '—'}</span>
      </span>
    </button>
  );
}
