import test from 'node:test';
import assert from 'node:assert/strict';
import { change, products, rankProducts, runningScores, sets } from '../src/data/market.ts';

test('計画書の販売個数と増減率を保持し、元データを変更せず並べ替える', () => {
  assert.equal(products.length, 12);
  assert.deepEqual(products.slice(0, 4).map(change), [50, 35, 30, 25]);
  assert.equal(change(products.find(p => p.id === 'milk')!), 5);
  assert.equal(change(products.find(p => p.id === 'bread')!), -5);
  const snapshot = structuredClone(products);
  assert.equal(rankProducts('asc')[0].id, 'cereal');
  assert.equal(rankProducts('desc')[0].id, 'curry');
  assert.deepEqual(products, snapshot);
});

test('ORAは全12商品を土台とし、カレーは上位4商品のすべてを占める', () => {
  assert.equal(sets.curry.ids.length, 4);
  assert.equal(rankProducts('desc').slice(0, 4).filter(p => sets.curry.ids.includes(p.id)).length, 4);
  assert.ok(sets.curry.ids.includes('onion') && sets.stew.ids.includes('onion'));
});

test('重みなし曲線は0から始まり0に戻り、降順カレーの最大値は1', () => {
  for (const set of Object.values(sets)) {
    for (const order of ['desc', 'asc'] as const) {
      const scores = runningScores(rankProducts(order), set.ids);
      assert.equal(scores.length, 13);
      assert.equal(scores[0], 0);
      assert.equal(scores[12], 0);
      assert.ok(scores.every(s => Math.abs(s) <= 1.00000001));
    }
  }
  assert.equal(Math.max(...runningScores(rankProducts('desc'), sets.curry.ids)), 1);
  assert.equal(Math.min(...runningScores(rankProducts('asc'), sets.curry.ids)), -1);
  assert.throws(() => runningScores(products, []));
  assert.throws(() => runningScores(products, products.map(p => p.id)));
});
