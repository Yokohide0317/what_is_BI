import { change, foldChange, percent, products, rankProducts, salesAmount, type ProductOrder, type Recipe } from '../data/market';

type SalesView =
  | { kind: 'raw' }
  | { kind: 'ratios'; order: ProductOrder }
  | { kind: 'ingredients'; recipe: Recipe | null }
  | { kind: 'ranked'; recipe: Recipe };

export default function MarketSalesTable({ view }: { view: SalesView }) {
  const ranked = view.kind === 'ranked';
  const showRatio = view.kind !== 'raw';
  const recipe = view.kind === 'raw' || view.kind === 'ratios' ? null : view.recipe;
  const order = view.kind === 'ratios' ? view.order : ranked ? 'desc' : 'catalog';
  const rows = rankProducts(order);
  const orderLabel = order === 'asc' ? '夏÷冬の倍率が小さい順' : order === 'desc' ? '夏÷冬の倍率が大きい順' : '商品一覧順';
  const label = ranked ? `増減率順の売上と${recipe?.name}の材料`
    : view.kind === 'ingredients' ? '商品一覧順の売上とレシピの材料'
      : view.kind === 'ratios' ? `${orderLabel}の冬・夏の売上金額と倍率`
      : `全${products.length}商品の冬・夏の売上金額`;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="table-scroll market-table count-table" tabIndex={0} role="region" aria-label={label}>
      <table>
        <caption className="sr-only">
          同じ店舗の冬と夏、各30日間の売上金額。単位は円。
          {recipe && `${recipe.name}の材料に色を付けています。`}
          {(view.kind === 'ratios' || view.kind === 'ingredients') && `夏の売上金額を冬の売上金額で割った倍率を、${orderLabel}に示しています。`}
          {ranked && '夏÷冬の倍率と、冬を基準にした増減率を示しています。増減率の大きい順です。'}
        </caption>
        <thead><tr>
          <th scope="col">商品</th><th scope="col">冬（円）</th><th scope="col">夏（円）</th>
          {showRatio && <th scope="col" aria-sort={order === 'asc' ? 'ascending' : order === 'desc' ? 'descending' : 'none'}>夏 ÷ 冬</th>}
          {ranked && <th scope="col">増減率</th>}
        </tr></thead>
        <tbody>
          {rows.map(product => {
            const isIngredient = recipe?.ids.includes(product.id) ?? false;
            return <tr key={product.id} className={isIngredient ? 'ingredient-row' : undefined}>
              <th scope="row">{isIngredient && <span className="sr-only">{recipe?.name}の材料：</span>}{product.name}</th>
              <td>{salesAmount(product.winter)}</td><td>{salesAmount(product.summer)}</td>
              {showRatio && <td>{foldChange(product).toFixed(2)}倍</td>}
              {ranked && <td>{percent(change(product))}</td>}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}
