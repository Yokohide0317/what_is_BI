import { useState } from 'react';
import { curryRecipe, rankProducts } from '../data/market';
import { runningScores } from '../data/enrichment';
import '../styles/curry-enrichment.css';

const ranked = rankProducts('desc');
const members = new Set(curryRecipe.ids);
const scores = runningScores(ranked, curryRecipe.ids);
const peak = scores.reduce((best, score) => Math.abs(score) > Math.abs(best) ? score : best, 0);
const peakRank = scores.indexOf(peak);
const otherCount = ranked.length - members.size;
const x = (rank: number) => 60 + rank / ranked.length * 600;
const y = (score: number) => 198 - score * 100;
const curve = scores.map((score, rank) => `${x(rank)},${y(score)}`).join(' ');
const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}`;

export default function CurryEnrichment() {
  const [position, setPosition] = useState(peakRank);
  const current = ranked[position - 1];
  const hits = ranked.slice(0, position).filter(product => members.has(product.id)).length;
  const isIngredient = current !== undefined && members.has(current.id);

  return <figure className="curry-enrichment">
    <figcaption><strong>カレーの材料の位置と累積スコア</strong><span>序論と同じ{ranked.length}商品・材料{members.size}品</span></figcaption>
    <div className="curry-enrichment-legend"><span><i className="curry-hit" />カレーの材料</span><span><i className="curry-miss" />それ以外</span></div>
    <div className="curry-chart-scroll">
      <svg viewBox="0 0 720 430" role="img" aria-labelledby="curry-es-title curry-es-desc">
        <title id="curry-es-title">カレーの材料は順位の上位に集まる</title>
        <desc id="curry-es-desc">夏を冬で割った売上比の大きい順に121商品を並べた図。材料11品の位置を茶色の棒で示す。材料で11分の1上がり、材料以外で110分の1下がる曲線は、35位でES約プラス0.78となり、121位で0に戻る。</desc>
        <text x="60" y="27">累積スコア（running ES）</text>
        {[-1, 0, 1].map(value => <g key={value}>
          <line x1="60" x2="660" y1={y(value)} y2={y(value)} className={value === 0 ? 'curry-zero-line' : 'curry-grid-line'} />
          <text x="46" y={y(value) + 5} textAnchor="end">{value > 0 ? '+1' : value}</text>
        </g>)}
        <polyline points={curve} fill="none" stroke="var(--green)" strokeWidth="3" strokeLinejoin="round" />
        <line x1={x(peakRank)} x2={x(peakRank)} y1={y(peak)} y2={y(0)} stroke="#a86130" strokeDasharray="4 4" />
        <circle cx={x(peakRank)} cy={y(peak)} r="5" fill="#a86130" />
        <text x={x(peakRank) + 14} y={y(peak) - 14} className="curry-peak-label">ES {signed(peak)}（{peakRank}位）</text>
        <line x1={x(position)} x2={x(position)} y1="98" y2="352" className="curry-position-line" />
        <circle cx={x(position)} cy={y(scores[position])} r="6" fill="var(--paper)" stroke="var(--green)" strokeWidth="3" />
        {ranked.map((product, index) => {
          const hit = members.has(product.id);
          return <rect key={product.id} x={x(index + 1) - 2} y={hit ? 320 : 328} width="3.5" height={hit ? 32 : 16} rx=".5" fill={hit ? '#a86130' : '#d4ddd1'}><title>{`${index + 1}位：${product.name}${hit ? '（カレーの材料）' : ''}`}</title></rect>;
        })}
        {[1, 35, 60, 90, ranked.length].map(rank => <text key={rank} x={x(rank)} y="377" textAnchor="middle">{rank}</text>)}
        <text x="60" y="413">夏 ÷ 冬が大きい</text><text x="660" y="413" textAnchor="end">夏 ÷ 冬が小さい</text>
      </svg>
    </div>
    <div className="curry-position-control"><label htmlFor="curry-rank-position">商品の順位 <strong>{position === 0 ? '開始点' : `${position} / ${ranked.length}`}</strong></label><input id="curry-rank-position" type="range" min="0" max={ranked.length} value={position} onChange={event => setPosition(Number(event.target.value))} /><div><button disabled={position === 0} onClick={() => setPosition(position - 1)}>前へ</button><button disabled={position === ranked.length} onClick={() => setPosition(position + 1)}>次へ</button></div></div>
    <div className="curry-score-readout" aria-live="polite" aria-atomic="true">
      <div><strong>{current?.name ?? '開始点'}</strong><span>{current ? isIngredient ? `材料なので +1/${members.size}` : `材料以外なので −1/${otherCount}` : '累積スコア 0から始める'}</span></div>
      <p><span>ここまでの割合の差</span><strong>{hits}/{members.size} − {position - hits}/{otherCount} ＝ {signed(scores[position])}</strong></p>
    </div>
  </figure>;
}
