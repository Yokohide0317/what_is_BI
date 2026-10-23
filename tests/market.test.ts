import test from 'node:test';
import assert from 'node:assert/strict';
import { change, products, rankProducts, sets } from '../src/data/market.ts';

test('冬と夏の48商品の販売個数を保持する', () => {
  assert.equal(products.length, 48);
  assert.equal(new Set(products.map(p => p.id)).size, 48);
  for (const product of products) {
    assert.ok(Number.isInteger(product.winter) && product.winter > 0);
    assert.ok(Number.isInteger(product.summer) && product.summer >= 0);
  }
  assert.deepEqual(sets.curry.ids.map(id => change(products.find(p => p.id === id)!)), [50, 35, 30, 25]);
  assert.equal(change(products.find(p => p.id === 'milk')!), 5);
  assert.equal(change(products.find(p => p.id === 'bread')!), -5);
});

test('元データを変更せず並べ替え、一覧順に戻せる', () => {
  const snapshot = structuredClone(products);
  assert.equal(rankProducts('asc')[0].id, 'mandarin');
  assert.equal(rankProducts('desc')[0].id, 'watermelon');
  assert.deepEqual(rankProducts('catalog'), snapshot);
  assert.deepEqual(products, snapshot);
});

test('すべての集まりに商品が存在し、集まり同士は重なってよい', () => {
  for (const set of Object.values(sets)) {
    assert.equal(new Set(set.ids).size, set.ids.length);
    assert.ok(set.ids.every(id => products.some(p => p.id === id)));
  }
  assert.ok(sets.curry.ids.includes('onion') && sets.stew.ids.includes('onion'));
});
