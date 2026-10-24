import { useEffect, useRef, useState } from 'react';
import genes from '../data/genes.json';
import { rankGenes, runningScores } from '../data/enrichment';

const members = genes.filter(gene => gene.member).map(gene => gene.id);
const total = genes.length;

export default function GeneRankLab() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  useEffect(() => {
    setReady(true);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReducedMotion(media.matches); if (media.matches) setRunning(false); };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!running) return;
    if (step === total) { setRunning(false); return; }
    const timer = window.setTimeout(() => setStep(value => value + 1), 850);
    return () => window.clearTimeout(timer);
  }, [running, step]);
  const ranked = rankGenes(genes, 'desc');
  const scores = runningScores(ranked, members);
  const current = ranked[step - 1];
  const currentId = current?.id;
  useEffect(() => {
    const table = tableRef.current;
    const row = currentId && rowRefs.current.get(currentId);
    if (!table) return;
    if (!row) { table.scrollTop = 0; return; }
    const top = row.getBoundingClientRect().top - table.getBoundingClientRect().top;
    const headerHeight = table.querySelector('thead')?.getBoundingClientRect().height ?? 0;
    if (top < headerHeight) table.scrollTop += top - headerHeight;
    else if (top + row.clientHeight > table.clientHeight) table.scrollTop += top + row.clientHeight - table.clientHeight;
  }, [currentId]);
  const x = (index: number) => 48 + index / total * 480;
  const y = (score: number) => 116 - score * 120;
  const points = (values: number[]) => values.map((score, i) => `${x(i)},${y(score)}`).join(' ');
  const peak = scores.reduce((a, b) => Math.abs(b) > Math.abs(a) ? b : a, 0);
  const peakIndex = scores.indexOf(peak);
  const reset = () => { setRunning(false); setStep(0); };

  return <div className="lab gene-rank-lab">
    <div className="lab-heading"><h3>遺伝子の順位とセットA</h3><span className="data-badge">人工データ · 全{total}遺伝子</span></div>
    <div className="ranking-body">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div ref={tableRef} className="table-scroll market-table count-table" tabIndex={0} role="region" aria-label="全48遺伝子の順位とセット所属">
        <table><caption className="sr-only">◆はセットA。log₂ fold change順。</caption><thead><tr><th scope="col">順位 / 遺伝子</th><th scope="col">log₂ FC</th></tr></thead><tbody>{ranked.map((gene, i) => <tr key={gene.id} ref={element => { if (element) rowRefs.current.set(gene.id, element); else rowRefs.current.delete(gene.id); }} className={`${gene.member ? 'member-row' : ''} ${step === i + 1 ? 'current-row' : ''}`}><th scope="row"><span className="rank-number">{String(i + 1).padStart(2, '0')}</span><span className="membership-mark" aria-label={gene.member ? 'セットA' : 'セット外'}>{gene.member ? '◆' : '·'}</span>{gene.id}</th><td>{gene.log2fc > 0 ? '+' : ''}{gene.log2fc.toFixed(2)}</td></tr>)}</tbody></table>
      </div>
      <div className="score-panel">
        <svg viewBox="0 0 570 260" role="img" aria-labelledby="score-title score-desc">
          <title id="score-title">セットAの重みなし順位曲線</title><desc id="score-desc">横軸は順位、縦軸は累積スコア（running ES）。点線は全体、実線は現在のステップまで。絶対値が最大のスコアは{peak.toFixed(2)}。最後は0です。</desc>
          {[-0.5, 0, 0.5].map(value => <g key={value}><line x1="48" x2="528" y1={y(value)} y2={y(value)} stroke={value === 0 ? '#8e9b91' : '#e1e6df'} strokeDasharray={value === 0 ? undefined : '4 4'} /><text x="36" y={y(value) + 4} textAnchor="end">{value > 0 ? '+0.5' : value}</text></g>)}
          <text x="48" y="17">累積スコア（running ES）</text>
          <polyline points={points(scores)} fill="none" stroke="#b9c5ba" strokeWidth="2" strokeDasharray="4 4" />
          <polyline points={points(scores.slice(0, step + 1))} fill="none" stroke="#1f6556" strokeWidth="3.5" strokeLinejoin="round" />
          {ranked.map((gene, i) => gene.member && <rect key={gene.id} x={x(i + 1) - 2} y="197" width="4" height="9" fill="#b77342" />)}
          <line x1={x(peakIndex)} x2={x(peakIndex)} y1={y(0)} y2={y(peak)} stroke="#a86130" strokeDasharray="3 3" />
          <circle cx={x(peakIndex)} cy={y(peak)} r="4" fill="#a86130" />
          <text x={x(peakIndex) + (peakIndex > total / 2 ? -10 : 10)} y={y(peak) - 12} textAnchor={peakIndex > total / 2 ? 'end' : 'start'}>ES {peak > 0 ? '+' : ''}{peak.toFixed(2)}</text>
          <circle cx={x(step)} cy={y(scores[step])} r="5" fill="#1f6556" stroke="white" strokeWidth="2" />
          {[0, 12, 24, 36, total].map(value => <text key={value} x={x(value)} y="221" textAnchor="middle">{value}</text>)}
          <text x="288" y="252" textAnchor="middle">遺伝子の順位</text>
        </svg>
        <div className="step-status" aria-live="polite" aria-atomic="true"><span>{String(step).padStart(2, '0')} <small>/ {total}</small></span><p>{current ? <>{current.id}<strong>{current.member ? `セットA：+${(1 / members.length).toFixed(4)}` : `セット外：−${(1 / (total - members.length)).toFixed(4)}`}</strong></> : <>開始点<strong>セットAで上がり、セット外で下がる</strong></>}</p><b>{scores[step].toFixed(2)}</b></div>
        <fieldset disabled={!ready} className="step-controls"><legend className="sr-only">順位曲線の操作</legend><button disabled={step === 0} onClick={() => { setRunning(false); setStep(step - 1); }}>戻る</button><button className="primary" disabled={step === total} onClick={() => { setRunning(false); setStep(step + 1); }}>次へ →</button><button disabled={step === total || reducedMotion} onClick={() => setRunning(!running)}>{running ? '停止' : '再生'}</button><button onClick={reset}>リセット</button></fieldset>
        {reducedMotion && <p className="caption">動きを減らす設定のため、自動再生は無効です。</p>}
      </div>
    </div>
    <div className="lab-foot"><p>◆はセットA。点線は全{total}遺伝子をたどった曲線です。0から最も離れた点の値（ES）は{peak > 0 ? '+' : ''}{peak.toFixed(2)}です。</p><details><summary>スコアの計算方法</summary><p>セットAの{members.length}遺伝子では1 ÷ {members.length}、それ以外の{total - members.length}遺伝子では−1 ÷ {total - members.length}を足します。上昇の合計は+1、下降の合計は−1なので、最後は0に戻ります。重みづけ、NES・FDRの計算は行っていません。</p></details></div>
  </div>;
}
