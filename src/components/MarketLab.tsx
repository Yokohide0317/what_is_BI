import { useEffect, useState, type ReactNode } from 'react';
import { products, recipes, type ProductOrder, type Recipe } from '../data/market';
import MarketSalesTable from './MarketSalesTable';

export default function MarketLab({ children }: { children: ReactNode }) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ratioOrder, setRatioOrder] = useState<ProductOrder>('catalog');
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return <>
    <div className="lab market-lab">
      <div className="lab-heading"><h3>冬と夏の売上金額</h3><span className="data-badge">架空データ · 全{products.length}商品</span></div>
      <div className="market-body market-sales"><MarketSalesTable view={{ kind: 'raw' }} /></div>
    </div>

    <p>何が最も増減したでしょうか。商品ごとに、夏の売上金額を冬の売上金額で割ってみましょう。</p>
    <div id="market-ratios" className="lab market-lab">
      <div className="lab-heading"><h3>冬と夏の売上金額と倍率</h3><span className="data-badge">夏 ÷ 冬</span></div>
      <fieldset className="lab-controls" disabled={!ready}>
        <legend className="sr-only">倍率表の並び順</legend>
        <label>並び順
          <select value={ratioOrder} aria-controls="market-ratio-table" onChange={event => {
            const order = event.target.value;
            if (order === 'catalog' || order === 'asc' || order === 'desc') setRatioOrder(order);
          }}>
            <option value="catalog">商品一覧順</option>
            <option value="asc">夏 ÷ 冬の昇順</option>
            <option value="desc">夏 ÷ 冬の降順</option>
          </select>
        </label>
      </fieldset>
      <div id="market-ratio-table" className="market-body"><MarketSalesTable key={ratioOrder} view={{ kind: 'ratios', order: ratioOrder }} /></div>
    </div>

    {children}

    <p>商品ごとの売上を比べて、単品ずつでは何がよく売れたかが分かりました。では、家庭ではどんな料理が作られているのでしょうか。</p>
    <h3>商品を「材料のセット」として見る</h3>
    <p>レシピ集を使って、料理に使う材料をまとめて見てみましょう。</p>

    <div className="lab recipe-lab">
      <div className="lab-heading"><h3>レシピ集</h3><span className="data-badge">調味料・薬味を含む一例</span></div>
      <fieldset className="recipe-options" disabled={!ready}>
        <legend className="sr-only">調べたい料理</legend>
        {recipes.map(candidate => (
          <button
            type="button"
            key={candidate.id}
            className="recipe-card"
            aria-pressed={recipe?.id === candidate.id}
            aria-controls="recipe-comparison"
            onClick={() => setRecipe(current => current?.id === candidate.id ? null : candidate)}
          >
            <strong>{candidate.name}<small>{candidate.ids.length}品</small></strong>
            <span className="ingredient-chips">{products.filter(product => candidate.ids.includes(product.id)).map(product => <span key={product.id}>{product.name}</span>)}</span>
          </button>
        ))}
      </fieldset>
      <div id="recipe-comparison">
        <p className="recipe-status" role="status">
          {recipe ? <><span className="ingredient-swatch" aria-hidden="true" />{recipe.name}の材料（{recipe.ids.length}品）</> : '料理を選ぶと、材料に色が付きます。'}
        </p>
        <div className="market-body"><MarketSalesTable view={{ kind: 'ingredients', recipe }} /></div>
      </div>
    </div>
  </>;
}
