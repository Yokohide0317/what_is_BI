import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

type GseaPayload = {
  genes: number;
  sets: {
    name: string;
    ES: number;
    peakRank: number;
    size: number;
    leadingEdgeSize: number;
    hits: { rank: number; gene: string; leadingEdge: boolean }[];
    curveVertices: [number, number][];
  }[];
};

const browser = JSON.parse(readFileSync(new URL('../public/data/gsea.json', import.meta.url), 'utf8')) as GseaPayload;
const analysis = JSON.parse(readFileSync(new URL('../data/analysis/gsea-source/gsea_fig5.json', import.meta.url), 'utf8')) as GseaPayload;

test('GSEAの3曲線と遺伝子位置は再解析の出力に一致する', () => {
  assert.equal(browser.genes, 17155);
  assert.deepEqual(browser.sets.map(item => item.name), [
    'HALLMARK_E2F_TARGETS', 'E2F1_UP.V1_UP', 'E2F1_UP.V1_DN',
  ]);
  for (const [index, set] of browser.sets.entries()) {
    const source = analysis.sets[index];
    assert.equal(set.ES, source.ES);
    assert.equal(set.peakRank, source.peakRank);
    assert.equal(set.hits.length, source.size);
    assert.deepEqual(set.curveVertices, source.curveVertices);
    assert.deepEqual(set.hits.map(hit => [hit.rank, hit.gene]), source.hits.map(hit => [hit.rank, hit.gene]));
    assert.equal(set.hits.filter(hit => hit.leadingEdge).length, set.leadingEdgeSize);
    assert.ok(set.hits.every(hit => hit.leadingEdge === (set.ES > 0 ? hit.rank <= set.peakRank : hit.rank >= set.peakRank)));
    assert.equal(set.curveVertices.at(-1)?.[0], browser.genes);
    assert.ok(Math.abs(set.curveVertices.at(-1)![1]) < 0.00001);
    assert.ok(set.curveVertices.some(([rank, score]) => rank === set.peakRank && Math.abs(score - set.ES) < 0.00001));
  }
});
