import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { curryRecipe, rankProducts } from '../src/data/market.ts';
import { rankGenes, runningScores } from '../src/data/enrichment.ts';

const genes = JSON.parse(readFileSync(new URL('../src/data/genes.json', import.meta.url), 'utf8')) as { id: string; log2fc: number; member: boolean }[];
const members = genes.filter(gene => gene.member).map(gene => gene.id);

test('ORAの背景は全48遺伝子、選択群はTreatで減少の大きい12遺伝子', () => {
  const snapshot = structuredClone(genes);
  assert.equal(genes.length, 48);
  assert.equal(members.length, 16);
  const selected = rankGenes(genes, 'asc').slice(0, 12);
  assert.equal(selected.filter(gene => gene.member).length, 6);
  assert.ok(selected.every(gene => gene.log2fc < 0));
  assert.deepEqual(genes, snapshot);
});

test('遺伝子の重みなし曲線は全順位を使い、0に戻る', () => {
  for (const order of ['asc', 'desc'] as const) {
    const ranked = rankGenes(genes, order);
    const scores = runningScores(ranked, members);
    assert.equal(scores.length, genes.length + 1);
    assert.equal(scores[0], 0);
    assert.equal(scores.at(-1), 0);
    ranked.forEach((gene, i) => assert.ok(Math.abs(scores[i + 1] - scores[i] - (gene.member ? 1 / 16 : -1 / 32)) < 1e-10));
    assert.ok(scores.every(score => Math.abs(score) <= 1));
  }
  assert.deepEqual(runningScores([{ id: 'a' }, { id: 'b' }], ['a']), [0, 1, 0]);
  assert.deepEqual(runningScores([{ id: 'b' }, { id: 'a' }], ['a']), [0, -1, 0]);
  assert.throws(() => runningScores(genes, []));
  assert.throws(() => runningScores(genes, genes.map(gene => gene.id)));
});

test('模式セットAは左に濃縮し、曲線は山から谷を通って0に戻る', () => {
  const ranked = rankGenes(genes, 'desc');
  const scores = runningScores(ranked, members);
  assert.equal(ranked.slice(0, 12).filter(gene => gene.member).length, 10);
  assert.equal(ranked.slice(12, 38).filter(gene => gene.member).length, 0);
  assert.equal(ranked.slice(38).filter(gene => gene.member).length, 6);
  assert.equal(Math.max(...scores), 0.5625);
  assert.equal(Math.min(...scores), -0.25);
  assert.equal(scores.at(-1), 0);
});


test('カレーの解説図は序論の全商品を使い、34位でESが最大になる', () => {
  const ranked = rankProducts('desc');
  const scores = runningScores(ranked, curryRecipe.ids);
  assert.equal(ranked.length, 121);
  assert.equal(curryRecipe.ids.length, 11);
  const peak = Math.max(...scores);
  assert.equal(scores.indexOf(peak), 34);
  assert.ok(Math.abs(peak - (10 / 11 - 24 / 110)) < 1e-10);
  assert.equal(ranked.findIndex(product => product.id === 'rice') + 1, 64);
  assert.equal(scores.at(-1), 0);
  ranked.forEach((product, index) => {
    const expected = curryRecipe.ids.includes(product.id) ? 1 / 11 : -1 / 110;
    assert.ok(Math.abs(scores[index + 1] - scores[index] - expected) < 1e-10);
  });
});
