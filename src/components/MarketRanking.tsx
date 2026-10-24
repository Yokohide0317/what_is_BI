import { useState } from 'react';
import MarketSalesTable from './MarketSalesTable';
import { change, curryRecipe, percent, products, rankProducts, recipes, type Recipe } from '../data/market';

const ranked = rankProducts('desc');
const choices = recipes.filter(recipe => ['curry', 'stew', 'salad'].includes(recipe.id));
const plotWidth = 720;
const step = plotWidth / ranked.length;

export default function MarketRanking() {
  const [recipe, setRecipe] = useState<Recipe>(curryRecipe);
  const ingredientIds = new Set(recipe.ids);

  return <div id="market-ranking">
    <h3>増減率順に並べて、料理の材料を見る</h3>
    <div className="lab market-lab">
      <div className="lab-heading"><h3>夏 ÷ 冬が大きい商品から並べる</h3><span className="data-badge">全{products.length}商品</span></div>
      <fieldset className="ranking-recipe-options">
        <legend>材料を見る料理</legend>
        {choices.map(choice => <button
          key={choice.id}
          type="button"
          aria-pressed={recipe.id === choice.id}
          aria-controls="ranking-result"
          onClick={() => setRecipe(choice)}
        >{choice.name}</button>)}
      </fieldset>
      <div id="ranking-result">
        <figure className="market-rank-figure">
          <figcaption><span className="ingredient-swatch" aria-hidden="true" />{recipe.name}の材料（{recipe.ids.length}品）</figcaption>
          <svg viewBox={`0 0 ${plotWidth} 66`} role="img" aria-label={`全${products.length}商品を増減率の大きい順に並べ、${recipe.name}の材料${recipe.ids.length}品の位置を茶色で示した図`}>
            {ranked.map((product, index) => {
              const selected = ingredientIds.has(product.id);
              return <rect
                key={product.id}
                x={index * step} y={selected ? 6 : 18}
                width={Math.max(1, step - 1.5)} height={selected ? 48 : 24}
                rx="1" fill={selected ? '#a86130' : '#d4ddd1'}
              ><title>{`${index + 1}位：${product.name} ${percent(change(product))}${selected ? `・${recipe.name}の材料` : ''}`}</title></rect>;
            })}
          </svg>
          <div className="rank-direction"><span>増減率が大きい</span><span aria-hidden="true">→</span><span>増減率が小さい</span></div>
        </figure>
        <div className="market-body"><MarketSalesTable view={{ kind: 'ranked', recipe }} /></div>
      </div>
    </div>
  </div>;
}
