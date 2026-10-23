import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

type Gene = { id: string; control: number[]; treated: number[]; p: number; padj: number; log2fc: number; member: boolean };
const genes: Gene[] = JSON.parse(readFileSync(new URL('../src/data/genes.json', import.meta.url), 'utf8'));

test('人工データの全48遺伝子に各6反復があり、変化量とBH調整値が整合する', () => {
  assert.equal(genes.length, 48);
  assert.equal(new Set(genes.map(g => g.id)).size, 48);
  for (const g of genes) {
    assert.match(g.id, /^DEMO\d{2}$/);
    assert.equal(g.control.length, 6);
    assert.equal(g.treated.length, 6);
    assert.ok([...g.control, ...g.treated].every(v => v >= 1));
    const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(g.log2fc - Math.log2(sum(g.treated) / sum(g.control))) < 1e-12);
    assert.ok(g.p > 0 && g.p <= g.padj && g.padj <= 1);
  }
  const ordered = [...genes].sort((a, b) => a.p - b.p);
  let adjusted = 1;
  for (let i = ordered.length - 1; i >= 0; i--) {
    adjusted = Math.min(adjusted, ordered[i].p * 48 / (i + 1));
    assert.ok(Math.abs(adjusted - ordered[i].padj) < 1e-12);
  }
});

test('DEMO01の両側置換p値は全924通り中2通り、所属は事前定義通り', () => {
  assert.equal(genes[0].p, 2 / 924);
  assert.ok(Math.abs(2 ** genes[0].log2fc - 145 / 489) < 1e-12);
  genes.forEach((gene, i) => assert.equal(gene.member, i % 6 === 0 || i % 6 === 1));
});
