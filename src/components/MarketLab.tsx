import { useEffect, useState } from 'react';
import { change, percent, products, rankProducts, runningScores, sets, type SetKey } from '../data/market';

export default function MarketLab() {
  const [setKey, setSetKey] = useState<SetKey>('curry');
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
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
    if (step === products.length) { setRunning(false); return; }
    const timer = window.setTimeout(() => setStep(value => value + 1), 850);
    return () => window.clearTimeout(timer);
  }, [running, step]);
  const selected = sets[setKey];
  const ranked = rankProducts(order);
  const scores = runningScores(ranked, selected.ids);
  const hits = ranked.slice(0, 4).filter(p => selected.ids.includes(p.id)).length;
  const x = (index: number) => 48 + index * 40;
  const y = (score: number) => 112 - score * 76;
  const points = (values: number[]) => values.map((score, i) => `${x(i)},${y(score)}`).join(' ');
  const peak = scores.reduce((a, b) => Math.abs(b) > Math.abs(a) ? b : a, 0);
  const current = ranked[step - 1];
  const reset = () => { setRunning(false); setStep(0); };

  return <div className="lab market-lab">
    <div className="lab-heading"><div><span className="lab-index">教材 01</span><h3>商品を、集まりで見る</h3></div><span className="data-badge">架空データ</span></div>
    <fieldset className="lab-controls" disabled={!ready}>
      <legend className="sr-only">商品セットと並び順</legend>
      <label>セット<select value={setKey} onChange={e => { setSetKey(e.target.value as SetKey); reset(); }}>{Object.entries(sets).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}</select></label>
      <label>並び順<select value={order} onChange={e => { setOrder(e.target.value as 'desc' | 'asc'); reset(); }}><option value="desc">増加率の大きい順</option><option value="asc">増加率の小さい順</option></select></label>
    </fieldset>
    <div className="ora-summary"><div><span>全12商品では</span><strong>{selected.ids.length}<small> / 12商品</small></strong><span>{(selected.ids.length / 12 * 100).toFixed(1)}%</span></div><span className="compare-symbol" aria-hidden="true">→</span><div><span>先頭4商品では</span><strong>{hits}<small> / 4商品</small></strong><span>{hits / 4 * 100}%</span></div><p>{order === 'desc' ? '増加率が高い' : '増加率が低い'}4商品に、セットの商品がどれだけ含まれるかを比べます。</p></div>
    <div className="market-body">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="table-scroll market-table" tabIndex={0} role="region" aria-label="全12商品の販売個数と増減率">
        <table><caption className="sr-only">{selected.name}を◆で示した全12商品の表</caption><thead><tr><th scope="col">順位 / 商品</th><th scope="col">前月</th><th scope="col">今月</th><th scope="col">増減率</th></tr></thead><tbody>{ranked.map((p, i) => <tr key={p.id} className={`${selected.ids.includes(p.id) ? 'member-row' : ''} ${step === i + 1 ? 'current-row' : ''}`}><th scope="row"><span className="rank-number">{String(i + 1).padStart(2, '0')}</span><span className="membership-mark" aria-label={selected.ids.includes(p.id) ? 'セットに含まれる' : 'セット外'}>{selected.ids.includes(p.id) ? '◆' : '·'}</span>{p.name}</th><td>{p.before}</td><td>{p.after}</td><td>{percent(change(p))}</td></tr>)}</tbody></table>
      </div>
      <div className="score-panel">
        <div className="chart-title"><h4>順位をたどる曲線</h4><span>重みなしの模式例</span></div>
        <svg viewBox="0 0 570 240" role="img" aria-labelledby="score-title score-desc">
          <title id="score-title">{selected.name}の累積スコア</title><desc id="score-desc">横軸は順位、縦軸は簡略スコア。灰色の線は全体の静止図、緑色の線は現在のステップまで。最大の絶対的な偏りは{peak.toFixed(2)}です。</desc>
          {[-1, 0, 1].map(value => <g key={value}><line x1="48" x2="528" y1={y(value)} y2={y(value)} stroke={value === 0 ? '#8e9b91' : '#e1e6df'} strokeDasharray={value === 0 ? undefined : '4 4'} /><text x="36" y={y(value) + 4} textAnchor="end">{value > 0 ? '+1' : value}</text></g>)}
          <text x="48" y="17">簡略スコア</text>
          <polyline points={points(scores)} fill="none" stroke="#b9c5ba" strokeWidth="2" strokeDasharray="4 4" />
          <polyline points={points(scores.slice(0, step + 1))} fill="none" stroke="#1f6556" strokeWidth="3.5" strokeLinejoin="round" />
          {ranked.map((p, i) => selected.ids.includes(p.id) && <rect key={p.id} x={x(i + 1) - 3} y="197" width="6" height="9" fill="#b77342" />)}
          <circle cx={x(step)} cy={y(scores[step])} r="5" fill="#1f6556" stroke="white" strokeWidth="2" />
          {[0, 4, 8, 12].map(value => <text key={value} x={x(value)} y="221" textAnchor="middle">{value}</text>)}
          <text x="288" y="238" textAnchor="middle">順位（時間ではありません）</text>
        </svg>
        <div className="step-status" aria-live="polite" aria-atomic="true"><span>{String(step).padStart(2, '0')} <small>/ 12</small></span><p>{current ? <>{current.name}<strong>{selected.ids.includes(current.id) ? `セット内：+${(1 / selected.ids.length).toFixed(3)}` : `セット外：−${(1 / (12 - selected.ids.length)).toFixed(3)}`}</strong></> : <>0からスタート<strong>セットの商品で上がり、それ以外で下がる</strong></>}</p><b>{scores[step].toFixed(2)}</b></div>
        <fieldset disabled={!ready} className="step-controls"><legend className="sr-only">順位曲線の操作</legend><button disabled={step === 0} onClick={() => { setRunning(false); setStep(step - 1); }}>戻る</button><button className="primary" disabled={step === 12} onClick={() => { setRunning(false); setStep(step + 1); }}>次へ <span aria-hidden="true">→</span></button><button disabled={step === 12 || reducedMotion} onClick={() => setRunning(!running)}>{running ? '停止' : '再生'}</button><button onClick={reset}>リセット</button></fieldset>
        {reducedMotion && <p className="caption">動きを減らす設定のため、手動で進めます。</p>}
      </div>
    </div>
    <div className="lab-foot"><strong>静止図の読み方</strong><p>{selected.name}は、全12商品中{selected.ids.length}商品。現在の並び順で、曲線の絶対値が最大になるスコアは{peak.toFixed(2)}です。灰色の点線で全体を確認できます。最後は0に戻ります。</p><details><summary>スコアの計算方法</summary><p>セット内では 1 ÷ {selected.ids.length}、セット外では −1 ÷ {12 - selected.ids.length} を足します。セット内の上昇を全部足すと+1、セット外の下降を全部足すと−1。順位指標での重みづけ、NES・FDRの計算は行っていません。</p></details></div>
  </div>;
}
