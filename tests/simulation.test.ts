import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterResults, plottableResults, resultsCsv } from '../src/data/simulation.ts';
import type { SimulationData } from '../src/data/simulation.ts';

const simulation = JSON.parse(readFileSync(new URL('../public/data/simulation.json', import.meta.url), 'utf8')) as SimulationData;

test('R/DESeq2の6試料とPPP3CAの結果を解析ファイルから読み込む', () => {
  assert.equal(simulation.genes.length, 19705);
  assert.deepEqual(simulation.samples.map(sample => sample.id), [
    'shControl_1', 'shControl_2', 'shControl_3', 'shPPP3CA_1', 'shPPP3CA_2', 'shPPP3CA_3',
  ]);
  assert.deepEqual(simulation.samples.map(sample => sample.condition), ['Control', 'Control', 'Control', 'Treat', 'Treat', 'Treat']);
  const target = simulation.genes.find(gene => gene.id === 'PPP3CA');
  assert.ok(target);
  assert.deepEqual(target.counts, [1293, 1425, 1276, 200, 175, 167]);
  assert.ok(Math.abs(target.log2FoldChange! - (-2.85556707781063)) < 1e-10);
  assert.ok(Math.abs(target.baseMean - target.counts.reduce((sum, value, index) => sum + value / simulation.samples[index].sizeFactor, 0) / 6) < 1e-8);
  assert.ok(Math.abs(target.counts[0] / simulation.samples[0].sizeFactor - 1193.46145522045) < 1e-8);
});

test('結果表とCSVは全遺伝子を含み、図の色分けは同じ実測値を使う', () => {
  const all = filterResults(simulation.genes, false, 0.05, 0);
  const filtered = filterResults(simulation.genes, true, 0.05, 1);
  assert.equal(all.length, 19705);
  assert.equal(all[0].id, 'PPP3CA');
  assert.ok(all[all.length - 1].padj === null);
  assert.ok(filtered.length > 0 && filtered.length < all.length);
  assert.ok(filtered.every(gene => gene.padj !== null && gene.padj < 0.05 && gene.log2FoldChange !== null && Math.abs(gene.log2FoldChange) >= 1));
  const plotted = plottableResults(all);
  assert.equal(plotted.length, 12518);
  assert.equal(plotted[0].id, 'PPP3CA');
  assert.ok(plotted.every(gene => gene.padj !== null && gene.log2FoldChange !== null));
  assert.ok(plotted.some(gene => gene.padj !== null && gene.padj >= 0.5));
  assert.deepEqual(resultsCsv(all).trim().split('\n').slice(1).map(row => row.split(',')[0]), all.map(gene => gene.id));
  assert.deepEqual(filterResults(simulation.genes, true, 0, 0), []);
});
