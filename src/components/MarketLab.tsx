import { useEffect, useState } from 'react';
import { change, percent, products, rankProducts, sets, type SetKey } from '../data/market';

export default function MarketLab() {
  const [setKey, setSetKey] = useState<SetKey>('curry');
  const [order, setOrder] = useState<'catalog' | 'desc' | 'asc'>('catalog');
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const selected = sets[setKey];
  return <div className="lab market-lab">
    <div className="lab-heading"><h3>冬と夏の販売個数</h3><span className="data-badge">架空データ · 全{products.length}商品</span></div>
    <fieldset className="lab-controls" disabled={!ready}>
      <legend className="sr-only">商品の強調と並び順</legend>
      <label>◆で示す集まり<select value={setKey} onChange={e => setSetKey(e.target.value as SetKey)}>{Object.entries(sets).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}</select></label>
      <label>並び順<select value={order} onChange={e => setOrder(e.target.value as typeof order)}><option value="catalog">商品一覧順</option><option value="desc">増加率の大きい順</option><option value="asc">増加率の小さい順</option></select></label>
    </fieldset>
    <div className="market-body">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="table-scroll market-table count-table" tabIndex={0} role="region" aria-label={`全${products.length}商品の冬・夏の販売個数`}>
        <table><caption className="sr-only">{selected.name}を◆で示した販売個数。同じ店舗の冬と夏、各30日間。</caption><thead><tr><th scope="col">商品</th><th scope="col">冬（個）</th><th scope="col">夏（個）</th><th scope="col">増減率</th></tr></thead><tbody>{rankProducts(order).map(p => <tr key={p.id} className={selected.ids.includes(p.id) ? 'member-row' : ''}><th scope="row"><span className="membership-mark" aria-label={selected.ids.includes(p.id) ? '集まりに含まれる' : '集まりの外'}>{selected.ids.includes(p.id) ? '◆' : '·'}</span>{p.name}</th><td>{p.winter}</td><td>{p.summer}</td><td>{percent(change(p))}</td></tr>)}</tbody></table>
      </div>
    </div>
  </div>;
}
