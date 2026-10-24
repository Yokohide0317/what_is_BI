import test from 'node:test';
import assert from 'node:assert/strict';
import { change, curryRecipe, foldChange, products, rankProducts, recipes } from '../src/data/market.ts';

test('冬と夏の121商品の売上金額を円で保持する', () => {
  assert.equal(products.length, 121);
  assert.equal(new Set(products.map(p => p.id)).size, 121);
  assert.equal(new Set(products.map(p => p.name)).size, 121);
  for (const product of products) {
    assert.ok(Number.isInteger(product.winter) && product.winter > 0);
    assert.ok(Number.isInteger(product.summer) && product.summer >= 0);
  }
  const curry = recipes.find(recipe => recipe.id === 'curry');
  assert.ok(curry);
  assert.equal(curry.ids.length, 11);
  assert.deepEqual(['curry', 'onion', 'potato', 'carrot'].map(id => change(products.find(p => p.id === id)!)), [50, 80, 120, 180]);
  assert.deepEqual(products.find(p => p.id === 'curry'), { id: 'curry', name: 'カレールー', winter: 25000, summer: 37500 });
  assert.deepEqual(products.find(p => p.id === 'rice'), { id: 'rice', name: '米', winter: 640000, summer: 672000 });
  assert.equal(change(products.find(p => p.id === 'rice')!), 5);
  assert.equal(change(products.find(p => p.id === 'milk')!), 5);
  assert.equal(change(products.find(p => p.id === 'bread')!), -5);
});

test('元データを変更せず並べ替え、一覧順に戻せる', () => {
  const snapshot = structuredClone(products);
  assert.equal(rankProducts('asc')[0].id, 'mandarin');
  assert.equal(rankProducts('desc')[0].id, 'watermelon');
  assert.deepEqual(rankProducts('catalog'), snapshot);
  assert.deepEqual(products, snapshot);
  const ranked = rankProducts('desc');
  assert.ok(ranked.every((product, index) => index === 0 || foldChange(ranked[index - 1]) >= foldChange(product)));
  assert.equal(ranked.filter(product => curryRecipe.ids.includes(product.id)).length, 11);
  assert.equal(ranked.slice(0, 34).filter(product => curryRecipe.ids.includes(product.id)).length, 10);
});

test('レシピの材料は売上表に存在し、複数のレシピに同じ材料を使える', () => {
  assert.equal(new Set(recipes.map(recipe => recipe.id)).size, recipes.length);
  for (const recipe of recipes) {
    assert.ok(recipe.ids.length >= 8);
    assert.equal(new Set(recipe.ids).size, recipe.ids.length);
    assert.ok(recipe.ids.every(id => products.some(p => p.id === id)));
  }
  assert.ok(recipes.find(recipe => recipe.id === 'curry')?.ids.includes('onion'));
  assert.ok(recipes.find(recipe => recipe.id === 'stew')?.ids.includes('onion'));
});

test('夏÷冬の倍率と増減率を区別し、増加・同額・減少を計算する', () => {
  const cases = [
    { winter: 25000, summer: 37500, fold: 1.5, percent: 50 },
    { winter: 100000, summer: 100000, fold: 1, percent: 0 },
    { winter: 40000, summer: 20000, fold: 0.5, percent: -50 },
    { winter: 10000, summer: 0, fold: 0, percent: -100 },
  ];
  for (const example of cases) {
    const product = { id: 'example', name: '計算例', winter: example.winter, summer: example.summer };
    assert.equal(foldChange(product), example.fold);
    assert.equal(change(product), example.percent);
  }
});
