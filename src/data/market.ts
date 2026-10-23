export const products = [
  { id: 'rice', name: '米', winter: 320, summer: 336 },
  { id: 'bread', name: '食パン', winter: 400, summer: 380 },
  { id: 'pasta', name: 'パスタ', winter: 180, summer: 198 },
  { id: 'udon', name: 'うどん', winter: 240, summer: 216 },
  { id: 'somen', name: 'そうめん', winter: 60, summer: 240 },
  { id: 'flour', name: '小麦粉', winter: 140, summer: 126 },
  { id: 'curry', name: 'カレールー', winter: 100, summer: 150 },
  { id: 'stew', name: 'シチュールー', winter: 160, summer: 80 },
  { id: 'miso', name: 'みそ', winter: 220, summer: 198 },
  { id: 'soy-sauce', name: 'しょうゆ', winter: 200, summer: 210 },
  { id: 'oil', name: '食用油', winter: 180, summer: 189 },
  { id: 'salt', name: '塩', winter: 100, summer: 105 },
  { id: 'onion', name: 'たまねぎ', winter: 200, summer: 270 },
  { id: 'potato', name: 'じゃがいも', winter: 200, summer: 260 },
  { id: 'carrot', name: 'にんじん', winter: 100, summer: 125 },
  { id: 'cabbage', name: 'キャベツ', winter: 180, summer: 171 },
  { id: 'lettuce', name: 'レタス', winter: 120, summer: 168 },
  { id: 'tomato', name: 'トマト', winter: 160, summer: 256 },
  { id: 'cucumber', name: 'きゅうり', winter: 100, summer: 200 },
  { id: 'eggplant', name: 'なす', winter: 80, summer: 160 },
  { id: 'radish', name: '大根', winter: 200, summer: 130 },
  { id: 'spinach', name: 'ほうれん草', winter: 180, summer: 126 },
  { id: 'mushroom', name: 'しめじ', winter: 160, summer: 128 },
  { id: 'bean-sprouts', name: 'もやし', winter: 300, summer: 315 },
  { id: 'apple', name: 'りんご', winter: 200, summer: 140 },
  { id: 'banana', name: 'バナナ', winter: 240, summer: 252 },
  { id: 'mandarin', name: 'みかん', winter: 300, summer: 60 },
  { id: 'watermelon', name: 'すいか', winter: 10, summer: 100 },
  { id: 'chicken', name: '鶏肉', winter: 320, summer: 352 },
  { id: 'pork', name: '豚肉', winter: 300, summer: 330 },
  { id: 'beef', name: '牛肉', winter: 160, summer: 176 },
  { id: 'salmon', name: '鮭', winter: 200, summer: 180 },
  { id: 'mackerel', name: 'さば', winter: 140, summer: 126 },
  { id: 'tofu', name: '豆腐', winter: 300, summer: 420 },
  { id: 'natto', name: '納豆', winter: 280, summer: 294 },
  { id: 'egg', name: '卵', winter: 400, summer: 400 },
  { id: 'milk', name: '牛乳', winter: 400, summer: 420 },
  { id: 'yogurt', name: 'ヨーグルト', winter: 240, summer: 264 },
  { id: 'cheese', name: 'チーズ', winter: 180, summer: 171 },
  { id: 'butter', name: 'バター', winter: 120, summer: 108 },
  { id: 'ice-cream', name: 'アイスクリーム', winter: 120, summer: 360 },
  { id: 'barley-tea', name: '麦茶', winter: 100, summer: 300 },
  { id: 'water', name: 'ミネラルウォーター', winter: 400, summer: 640 },
  { id: 'coffee', name: 'コーヒー', winter: 200, summer: 190 },
  { id: 'juice', name: 'ジュース', winter: 180, summer: 270 },
  { id: 'chocolate', name: 'チョコレート', winter: 240, summer: 144 },
  { id: 'chips', name: 'ポテトチップス', winter: 200, summer: 220 },
  { id: 'cereal', name: 'シリアル', winter: 120, summer: 126 },
];
export type Product = (typeof products)[number];
export const sets = {
  curry: { name: 'カレーの材料', ids: ['curry', 'onion', 'potato', 'carrot'] },
  stew: { name: 'シチューの材料', ids: ['stew', 'onion', 'potato', 'carrot', 'milk'] },
  breakfast: { name: '朝食の商品', ids: ['milk', 'egg', 'bread', 'coffee', 'yogurt', 'cereal'] },
};
export type SetKey = keyof typeof sets;
export const change = (p: Product) => ((p.summer - p.winter) / p.winter) * 100;
export const percent = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(0)}%`;
export function rankProducts(order: 'catalog' | 'desc' | 'asc') {
  if (order === 'catalog') return [...products];
  return [...products].sort((a, b) => (order === 'desc' ? -1 : 1) * (change(a) - change(b)));
}
