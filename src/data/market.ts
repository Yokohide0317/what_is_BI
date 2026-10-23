export const products = [
  { id: 'curry', name: 'カレールー', before: 100, after: 150 },
  { id: 'onion', name: 'たまねぎ', before: 200, after: 270 },
  { id: 'potato', name: 'じゃがいも', before: 200, after: 260 },
  { id: 'carrot', name: 'にんじん', before: 100, after: 125 },
  { id: 'stew', name: 'シチュールー', before: 100, after: 115 },
  { id: 'apple', name: 'りんご', before: 100, after: 110 },
  { id: 'milk', name: '牛乳', before: 200, after: 210 },
  { id: 'egg', name: '卵', before: 200, after: 200 },
  { id: 'bread', name: 'パン', before: 200, after: 190 },
  { id: 'coffee', name: 'コーヒー', before: 100, after: 90 },
  { id: 'yogurt', name: 'ヨーグルト', before: 100, after: 85 },
  { id: 'cereal', name: 'シリアル', before: 100, after: 80 },
];
export type Product = (typeof products)[number];
export const sets = {
  curry: { name: 'カレーの材料', ids: ['curry', 'onion', 'potato', 'carrot'] },
  stew: { name: 'シチューの材料', ids: ['stew', 'onion', 'potato', 'carrot', 'milk'] },
  breakfast: { name: '朝食の商品', ids: ['milk', 'egg', 'bread', 'coffee', 'yogurt', 'cereal'] },
};
export type SetKey = keyof typeof sets;
export const change = (p: Product) => ((p.after - p.before) / p.before) * 100;
export const percent = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(0)}%`;
export function rankProducts(order: 'desc' | 'asc') {
  return [...products].sort((a, b) => (order === 'desc' ? -1 : 1) * (change(a) - change(b)));
}
export function runningScores(ranked: Product[], members: string[]) {
  const hits = ranked.filter(p => members.includes(p.id)).length;
  if (hits === 0 || hits === ranked.length) throw new Error('セット内・セット外の両方が必要です');
  let sum = 0;
  return [0, ...ranked.map(p => {
    sum += members.includes(p.id) ? 1 / hits : -1 / (ranked.length - hits);
    return Math.abs(sum) < 1e-10 ? 0 : sum;
  })];
}
