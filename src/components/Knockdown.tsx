import { useEffect, useState } from 'react';

const stages = [
  { title: 'DNAからmRNAが作られる', description: 'DNAの情報をもとにmRNAが作られます。この過程を「転写」と呼びます。' },
  { title: 'shRNAを利用して、標的mRNAを減らす', description: 'shRNAは細胞内で処理され、配列が対応するmRNAを減らす仕組みに利用されます。DNAは残っています。' },
  { title: 'タンパク質の量が下がる方向に働く', description: '材料となるmRNAが減ると、作られるタンパク質の量も下がる方向に働きます。実際に減ったかは別に測定して確かめます。' },
];
export default function Knockdown() {
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return <div className="lab knockdown-lab">
    <div className="lab-heading"><div><span className="lab-index">模式図</span><h3>DNAは残したまま、mRNAを減らす</h3></div></div>
    <div className="molecule-flow">
      <div className={step === 0 ? 'active' : ''}><span className="molecule-symbol dna" aria-hidden="true">╳<br />╳<br />╳</span><strong>DNA</strong><small>情報のもと</small></div>
      <span className="flow-arrow">転写<span aria-hidden="true">→</span></span>
      <div className={step === 1 ? 'active' : ''}><span className="molecule-symbol rna" aria-hidden="true">∿∿<br /><span className={step >= 1 ? 'diminished' : ''}>∿∿<br />∿∿</span></span><strong>mRNA</strong><small>{step >= 1 ? '標的のmRNAが減る' : '情報を写したもの'}</small></div>
      <span className="flow-arrow">翻訳<span aria-hidden="true">→</span></span>
      <div className={step === 2 ? 'active' : ''}><span className="molecule-symbol protein" aria-hidden="true">●<span className={step >= 2 ? 'diminished' : ''}>●<br />●●</span></span><strong>タンパク質</strong><small>{step >= 2 ? '量の低下を測定で確認' : '細胞で働く分子'}</small></div>
    </div>
    <div className="mechanism-status" aria-live="polite" aria-atomic="true"><span className="lab-index">{step + 1} / 3</span><strong>{stages[step].title}</strong><p>{stages[step].description}</p></div>
    <fieldset disabled={!ready} className="step-controls"><legend className="sr-only">shRNA模式図の操作</legend><button disabled={step === 0} onClick={() => setStep(step - 1)}>戻る</button><button className="primary" disabled={step === 2} onClick={() => setStep(step + 1)}>次へ →</button><button onClick={() => setStep(0)}>リセット</button></fieldset>
    <p className="caption">図の要約：DNA → mRNA → タンパク質。shRNAは標的mRNAを減らす仕組みに利用され、DNAを消すものではありません。分子の数は実測値ではありません。</p>
  </div>;
}
