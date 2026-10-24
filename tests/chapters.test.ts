import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const homePage = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const page = readFileSync(new URL('../src/pages/rna-seq/introduction.mdx', import.meta.url), 'utf8');
const rnaPage = readFileSync(new URL('../src/pages/rna-seq.mdx', import.meta.url), 'utf8');
const referencesPage = readFileSync(new URL('../src/pages/references.mdx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/layouts/Lesson.astro', import.meta.url), 'utf8');

test('序論とRNA-seqを別ページに分け、8章の目次と本文を一致させる', () => {
  const chapters = [...layout.matchAll(/\['([^']+)', '[^']+'\]/g)].map(match => match[1]);
  const introSections = [...page.matchAll(/<section id="([^"]+)"/g)].map(match => match[1]);
  const rnaSections = [...rnaPage.matchAll(/<section id="([^"]+)"/g)].map(match => match[1]);
  const sections = [...introSections, ...rnaSections];
  assert.deepEqual(introSections, ['market']);
  assert.equal(rnaSections[0], 'genes');
  assert.equal(chapters.length, 8);
  assert.deepEqual(chapters, sections);
  assert.equal(new Set(sections).size, sections.length);
  assert.match(page.split('</section>')[0], /カレー/);
  assert.doesNotMatch(rnaPage, /MarketLab/);
  assert.match(rnaPage, /<GeneCounts/);
  assert.match(rnaPage, /<GeneRankLab/);
  assert.match(layout, /href="\/rna-seq\/" rel="next"/);
  assert.match(layout, /href="\/rna-seq\/introduction\/" rel="prev"/);
  assert.match(layout, /href="\/simulation\/" rel="next"/);
  assert.doesNotMatch(rnaPage, /<section id="(?:sets|ora|paper)"/);
});

test('トップからRNA-seqの序論・解説・解析体験に進める', () => {
  assert.match(homePage, /href="\/rna-seq\/introduction\/"/);
  assert.match(homePage, /href="\/rna-seq\/"/);
  assert.match(homePage, /href="\/simulation\/"/);
  assert.match(layout, /isHome \? '解析を選ぶ'/);
  assert.match(layout, /href="\/" aria-current=\{isHome/);
});

test('用語と参考文献を別ページにする', () => {
  const sections = [...referencesPage.matchAll(/<section id="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(sections, ['glossary', 'sources']);
  assert.doesNotMatch(rnaPage, /<section id="(?:glossary|sources)"/);
  assert.match(layout, /href="\/references\/#glossary"/);
  assert.match(layout, /href="\/references\/#sources"/);
});

test('不要な紹介文と前月・今月の表記を戻さない', () => {
  assert.doesNotMatch(page + rnaPage + layout, /スーパーの商品から、細胞のなかへ|一つひとつの変化と、集まりの偏りを考える|医学部1年生から|約15〜20分|操作できる教材|前月|今月/);
});
