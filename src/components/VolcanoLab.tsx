import { useEffect, useRef, useState } from 'react';
import genes from '../data/genes.json';

const format = (value: number) => value.toFixed(3);
const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
export default function VolcanoLab() {
  const [selectedId, setSelectedId] = useState('DEMO01');
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(false);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  useEffect(() => {
    setReady(true);
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const selected = genes.find(g => g.id === selectedId)!;
  const plotWidth = compact ? 390 : 710;
  const right = plotWidth - 58;
  const x = (fc: number) => 66 + (fc + 2.25) / 4.5 * (right - 66);
  const y = (padj: number) => 263 + Math.log10(padj) / 2.2 * 226;
  const choosePoint = (id: string) => {
    setSelectedId(id);
    rowRefs.current.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  };
  return <div className="lab volcano-lab">
    <div className="lab-heading"><div><span className="lab-index">教材 02</span><h3>遺伝子の表とボルケーノプロット</h3></div><span className="data-badge">人工データ · 全48遺伝子</span></div>
    <p className="lab-intro">条件Bと対照Aの比較。DEMO01〜48は架空の遺伝子です。原論文のshCaN実験ではありません。</p>
    <div className="plot-legend"><span><b className="diamond">◆</b> 模式セットA</span><span><b className="circle">○</b> セット外</span><span>色・形はセットへの所属を表します</span></div>
    <svg className={`volcano-chart ${compact ? 'compact-chart' : 'wide-chart'}`} viewBox={`0 0 ${plotWidth} 330`} role="group" aria-label="48遺伝子のボルケーノプロット。点はキーボードまたは表からも選択できます。">
      {[0, 1, 2].map(value => <g key={value}><line x1="66" x2={right} y1={263 - value / 2.2 * 226} y2={263 - value / 2.2 * 226} stroke="#e1e6df" /><text x="53" y={267 - value / 2.2 * 226} textAnchor="end">{value}</text></g>)}
      <line x1={x(0)} x2={x(0)} y1="30" y2="263" stroke="#b6c3b9" />
      <line x1="66" x2={right} y1={y(0.05)} y2={y(0.05)} stroke="#a5ada4" strokeDasharray="4 4" /><text x={right - 2} y={y(0.05) - 8} textAnchor="end">調整済みp = 0.05</text>
      <text x="24" y="160" textAnchor="middle" transform="rotate(-90 24 160)">−log₁₀ 調整済みp値</text>
      {[-2, -1, 0, 1, 2].map(value => <text key={value} x={x(value)} y="284" textAnchor="middle">{value > 0 ? `+${value}` : value}</text>)}
      <text x={(66 + right) / 2} y="308" textAnchor="middle">log₂ fold change（条件B / 対照A）</text>
      <text x="66" y="327">← Bで少ない</text><text x={right} y="327" textAnchor="end">Bで多い →</text>
      {genes.map(gene => <g key={gene.id} role="button" tabIndex={ready ? 0 : -1} aria-disabled={!ready} aria-label={`${gene.id}、log2変化量 ${signed(gene.log2fc)}、調整済みp値 ${format(gene.padj)}、${gene.member ? 'セットA' : 'セット外'}`} aria-pressed={selectedId === gene.id} onClick={() => ready && choosePoint(gene.id)} onKeyDown={event => { if (ready && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); choosePoint(gene.id); } }} className={`gene-point ${gene.member ? 'in-set' : ''}`}>
        <circle cx={x(gene.log2fc)} cy={y(gene.padj)} r="11" fill="transparent" />
        {gene.member ? <path d={`M${x(gene.log2fc)},${y(gene.padj) - 5}l5,5 -5,5 -5,-5z`} /> : <circle cx={x(gene.log2fc)} cy={y(gene.padj)} r="4" />}
      </g>)}
      <circle cx={x(selected.log2fc)} cy={y(selected.padj)} r="10" fill="none" stroke="#243e32" strokeWidth="2" pointerEvents="none" />
      <text x={x(selected.log2fc)} y={Math.max(20, y(selected.padj) - 17)} textAnchor="middle" className="selected-label" pointerEvents="none">{selected.id}</text>
    </svg>
    <div className="gene-data">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="table-scroll gene-table" tabIndex={0} role="region" aria-label="全48遺伝子の表">
        <table><caption className="sr-only">人工遺伝子の変化量とBH調整済みp値。遺伝子名で選択。</caption><thead><tr><th scope="col">遺伝子</th><th scope="col">log₂ FC</th><th scope="col">調整済みp</th></tr></thead><tbody>{genes.map(gene => <tr key={gene.id} ref={element => { if (element) rowRefs.current.set(gene.id, element); else rowRefs.current.delete(gene.id); }} className={selectedId === gene.id ? 'selected-row' : ''}><th scope="row"><button disabled={!ready} aria-pressed={selectedId === gene.id} onClick={() => setSelectedId(gene.id)}><span className={gene.member ? 'diamond' : 'circle'} aria-label={gene.member ? 'セットA' : 'セット外'}>{gene.member ? '◆' : '○'}</span> {gene.id}</button></th><td>{signed(gene.log2fc)}</td><td>{format(gene.padj)}</td></tr>)}</tbody></table>
      </div>
      <div className="gene-detail" aria-live="polite" aria-atomic="true"><span className="lab-index">選択中の遺伝子</span><h4>{selected.id}</h4><p>{selected.member ? '◆ 模式セットAに含まれる' : '○ 模式セットAには含まれない'}</p><dl><div><dt>log₂ fold change</dt><dd>{signed(selected.log2fc)}</dd></div><div><dt>条件B / 対照A</dt><dd>{(2 ** selected.log2fc).toFixed(2)} 倍</dd></div><div><dt>調整済みp値（BH）</dt><dd>{format(selected.padj)}</dd></div></dl></div>
    </div>
    <div className="lab-foot"><strong>静止図の読み方</strong><p>左はBで少ない遺伝子、右はBで多い遺伝子です。上下の位置とセットへの所属は別です。初期選択のDEMO01は約0.30倍ですが、これだけで変化の原因や働きまでは分かりません。</p>
      <details><summary>人工データの生成条件と計算方法</summary><p>全48遺伝子、対照Aと条件Bを各6反復。独立な正規乱数を整数に丸め、1未満は1とした任意単位の模擬発現量です。乱数シードは20261023。基準量は80〜200、標準偏差は基準量の0.12 / 0.25 / 0.45 / 0.65倍。Bの期待値は、最初の24遺伝子では基準量×2のe乗（e = −1.6 + (0始まりの番号 mod 12)×0.29）、残りはe = (番号 mod 5 − 2)×0.07です。セットAは番号 mod 6 が0または1の遺伝子として事前定義しています。</p><p>横軸は反復平均の比のlog₂。p値は12個の値を6対6に分ける全924通りの、平均差の絶対値を使った両側の正確置換検定から計算し、全48検定をBH法で調整しています。ライブラリサイズの正規化やRNA-seq特有の分布を扱う解析ではなく、統計的な指標を読むための簡略例です。実データの解析には、その実験に合った手法が必要です。</p><p>選択中の{selected.id}：対照A [{selected.control.join(', ')}]、条件B [{selected.treated.join(', ')}]。</p></details>
    </div>
  </div>;
}
