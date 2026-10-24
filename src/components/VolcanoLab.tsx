import { useEffect, useRef, useState } from 'react';
import genes from '../data/genes.json';

const format = (value: number) => value.toFixed(3);
const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
const classify = (gene: (typeof genes)[number]) => {
  if (gene.padj >= 0.05 || Math.abs(gene.log2fc) < 1) return 'other';
  return gene.log2fc < 0 ? 'decrease' : 'increase';
};
const statusLabels = {
  decrease: '基準を満たす・Treatで減少',
  increase: '基準を満たす・Treatで増加',
  other: '基準外',
};
export default function VolcanoLab() {
  const [selectedId, setSelectedId] = useState('Gene01');
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
  const selectedStatus = classify(selected);
  const plotWidth = compact ? 390 : 710;
  const right = plotWidth - 58;
  // Round drawing coordinates so server and browser Math.log10 results render identical attributes.
  const pixel = (value: number) => Math.round(value * 1000) / 1000;
  const x = (fc: number) => pixel(66 + (fc + 2.25) / 4.5 * (right - 66));
  const y = (padj: number) => pixel(263 + Math.log10(padj) / 2.2 * 226);
  const choosePoint = (id: string) => {
    setSelectedId(id);
    rowRefs.current.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  };
  return <div className="lab volcano-lab">
    <div className="lab-heading"><h3>遺伝子の表とボルケーノプロット</h3><span className="data-badge">人工データ · 全48遺伝子</span></div>
    <p className="lab-intro">TreatとControlの比較。Gene01〜48は架空の遺伝子です。原論文のshCaN実験ではありません。</p>
    <div className="plot-legend"><span><b className="volcano-mark status-decrease">●</b> Treatで減少</span><span><b className="volcano-mark status-increase">●</b> Treatで増加</span><span><b className="volcano-mark status-other">○</b> 基準外</span></div>
    <p className="plot-threshold">塗りつぶした点は、調整済みp値が0.05未満、かつ|log₂ FC|が1以上の遺伝子を示します。</p>
    <svg className={`volcano-chart ${compact ? 'compact-chart' : 'wide-chart'}`} viewBox={`0 0 ${plotWidth} 330`} role="group" aria-label="48遺伝子のボルケーノプロット。点はキーボードまたは表からも選択できます。">
      {[0, 1, 2].map(value => <g key={value}><line x1="66" x2={right} y1={263 - value / 2.2 * 226} y2={263 - value / 2.2 * 226} stroke="#e1e6df" /><text x="53" y={267 - value / 2.2 * 226} textAnchor="end">{value}</text></g>)}
      <line x1={x(0)} x2={x(0)} y1="30" y2="263" stroke="#b6c3b9" />
      {[-1, 1].map(value => <line key={value} x1={x(value)} x2={x(value)} y1="30" y2="263" stroke="#a5ada4" strokeDasharray="4 4" />)}
      <line x1="66" x2={right} y1={y(0.05)} y2={y(0.05)} stroke="#a5ada4" strokeDasharray="4 4" /><text x={right - 2} y={y(0.05) - 8} textAnchor="end">調整済みp = 0.05</text>
      <text x="24" y="160" textAnchor="middle" transform="rotate(-90 24 160)">−log₁₀ 調整済みp値</text>
      {[-2, -1, 0, 1, 2].map(value => <text key={value} x={x(value)} y="284" textAnchor="middle">{value > 0 ? `+${value}` : value}</text>)}
      <text x={(66 + right) / 2} y="308" textAnchor="middle">log₂ fold change（Treat / Control）</text>
      <text x="66" y="327">← Treatで少ない</text><text x={right} y="327" textAnchor="end">Treatで多い →</text>
      {genes.map(gene => { const status = classify(gene); return <g key={gene.id} role="button" tabIndex={ready ? 0 : -1} aria-disabled={!ready} aria-label={`${gene.id}、log2変化量 ${signed(gene.log2fc)}、調整済みp値 ${format(gene.padj)}、${statusLabels[status]}`} aria-pressed={selectedId === gene.id} onClick={() => ready && choosePoint(gene.id)} onKeyDown={event => { if (ready && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); choosePoint(gene.id); } }} className={`gene-point status-${status}`}>
        <circle cx={x(gene.log2fc)} cy={y(gene.padj)} r="11" fill="transparent" />
        <circle cx={x(gene.log2fc)} cy={y(gene.padj)} r="4.5" />
      </g>; })}
      <circle cx={x(selected.log2fc)} cy={y(selected.padj)} r="10" fill="none" stroke="#243e32" strokeWidth="2" pointerEvents="none" />
      <text x={x(selected.log2fc)} y={Math.max(20, y(selected.padj) - 17)} textAnchor="middle" className="selected-label" pointerEvents="none">{selected.id}</text>
    </svg>
    <div className="gene-data">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="table-scroll gene-table" tabIndex={0} role="region" aria-label="全48遺伝子の表">
        <table><caption className="sr-only">人工遺伝子の変化量とBH調整済みp値。遺伝子名で選択。</caption><thead><tr><th scope="col">遺伝子</th><th scope="col">log₂ FC</th><th scope="col">調整済みp</th></tr></thead><tbody>{genes.map(gene => { const status = classify(gene); return <tr key={gene.id} ref={element => { if (element) rowRefs.current.set(gene.id, element); else rowRefs.current.delete(gene.id); }} className={selectedId === gene.id ? 'selected-row' : ''}><th scope="row"><button disabled={!ready} aria-pressed={selectedId === gene.id} onClick={() => setSelectedId(gene.id)}><span className={`volcano-mark status-${status}`} role="img" aria-label={statusLabels[status]}>{status === 'other' ? '○' : '●'}</span> {gene.id}</button></th><td>{signed(gene.log2fc)}</td><td>{format(gene.padj)}</td></tr>; })}</tbody></table>
      </div>
      <div className="gene-detail" aria-live="polite" aria-atomic="true"><span className="lab-index">選択中の遺伝子</span><h4>{selected.id}</h4><p><span className={`volcano-mark status-${selectedStatus}`} aria-hidden="true">{selectedStatus === 'other' ? '○' : '●'}</span> {statusLabels[selectedStatus]}</p><dl><div><dt>log₂ fold change</dt><dd>{signed(selected.log2fc)}</dd></div><div><dt>Treat / Control</dt><dd>{(2 ** selected.log2fc).toFixed(2)} 倍</dd></div><div><dt>調整済みp値（BH）</dt><dd>{format(selected.padj)}</dd></div></dl></div>
    </div>
    <div className="lab-foot"><p>発現量の変化だけでは、原因や働きまでは分かりません。</p>
      <details><summary>人工データの生成条件と計算方法</summary><p>全48遺伝子、ControlとTreatを各6反復。独立な正規乱数を整数に丸め、1未満は1とした任意単位の模擬発現量です。乱数シードは20261023。基準量は80〜200、標準偏差は基準量の0.12 / 0.25 / 0.45 / 0.65倍。Treatの期待値は、最初の24遺伝子では基準量×2のe乗（e = −1.6 + (0始まりの番号 mod 12)×0.29）、残りはe = (番号 mod 5 − 2)×0.07です。</p><p>横軸は反復平均の比のlog₂。p値は12個の値を6対6に分ける全924通りの、平均差の絶対値を使った両側の正確置換検定から計算し、全48検定をBH法で調整しています。ライブラリサイズの正規化やRNA-seq特有の分布を扱う解析ではなく、統計的な指標を読むための簡略例です。実データの解析には、その実験に合った手法が必要です。</p><p>選択中の{selected.id}：Control [{selected.control.join(', ')}]、Treat [{selected.treated.join(', ')}]。</p></details>
    </div>
  </div>;
}
