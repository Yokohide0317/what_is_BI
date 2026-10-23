import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/index.mdx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/layouts/Lesson.astro', import.meta.url), 'utf8');

test('12章の目次と本文が一致し、カレーの例は序論だけに置く', () => {
  const chapters = [...layout.matchAll(/\['([^']+)', '[^']+'\]/g)].map(match => match[1]);
  const sections = [...page.matchAll(/<section id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(chapters.length, 12);
  assert.deepEqual(chapters, sections.slice(0, 12));
  assert.equal(new Set(sections).size, sections.length);
  assert.match(page.split('</section>')[0], /カレー/);
  assert.doesNotMatch(page.slice(page.indexOf('</section>')), /カレー|シチュー|MarketLab/);
  assert.match(page, /<GeneCounts/);
  assert.match(page, /<GeneRankLab/);
});

test('不要な紹介文と前月・今月の表記を戻さない', () => {
  assert.doesNotMatch(page + layout, /スーパーの商品から、細胞のなかへ|一つひとつの変化と、集まりの偏りを考える|医学部1年生から|約15〜20分|操作できる教材|前月|今月/);
});
