import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { filterResults, plottableResults, resultsCsv, steps } from '../data/simulation';
import type { SimulationData, SimulationGene } from '../data/simulation';
import AnalysisGsea from './AnalysisGsea';
import gseaScript from '../../data/analysis/gsea-source/run_gsea.py?raw';
import '../styles/simulation.css';

const scripts: Record<string, string> = { 'run_gsea.py': gseaScript };
const decimal = (value: number | null, digits = 2) => value === null ? 'NA' : value.toFixed(digits);
const probability = (value: number | null) => value === null ? 'NA' : value < 0.001 ? value.toExponential(2) : value.toFixed(3);
const displaySampleId = (id: string) => id.replace(/^shPPP3CA_(\d+)$/, 'shCaN Aα-$1').replace(/^shControl_(\d+)$/, 'shControl-$1');
const displayGroup = (group: string) => group === 'shPPP3CA' ? 'shCaN Aα' : group;
const pageSize = 50;
const plotScore = (padj: number) => -Math.log10(Math.max(padj, 1e-300));
type PlotLimits = { x: number; y: number };
const defaultPlotLimits: PlotLimits = { x: 2, y: 25 };
const expandPlotLimits = (limits: PlotLimits, gene: SimulationGene): PlotLimits => ({
  x: Math.max(limits.x, 5, Math.ceil(Math.abs(gene.log2FoldChange ?? 0) * 1.15 / 5) * 5),
  y: Math.max(limits.y, 40, Math.ceil(plotScore(gene.padj ?? 1) * 1.15 / 10) * 10),
});
const downloadCsv = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

function DownloadIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3" /></svg>;
}

export default function AnalysisSimulation({ children }: { children?: ReactNode }) {
  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let current = true;
    fetch('/data/simulation.json').then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<SimulationData>;
    }).then(data => { if (current) setSimulation(data); }).catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, []);
  if (error) return <p role="alert">解析結果を読み込めませんでした。ページを再読み込みしてください。</p>;
  if (!simulation) return <p role="status">解析結果を読み込んでいます。</p>;
  return <SimulationContent simulation={simulation}>{children}</SimulationContent>;
}

function SimulationContent({ simulation, children }: { simulation: SimulationData; children?: ReactNode }) {
  const [active, setActive] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [alpha, setAlpha] = useState(0.05);
  const [minFold, setMinFold] = useState(0);
  const [selectedId, setSelectedId] = useState('PPP3CA');
  const [expandedLimits, setExpandedLimits] = useState<PlotLimits | null>(null);
  const [page, setPage] = useState(0);
  const [compact, setCompact] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const workspace = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  // Move focus after the new step renders, so the focused heading announces the new title.
  useEffect(() => { if (focusRequest) heading.current?.focus({ preventScroll: true }); }, [focusRequest]);
  const step = steps[active];
  const ran = active < completed;
  const rows = useMemo(() => filterResults(simulation.genes, false, 0.05, 0), [simulation.genes]);
  const hits = useMemo(() => filterResults(simulation.genes, true, alpha, minFold), [simulation.genes, alpha, minFold]);
  const hitIds = useMemo(() => new Set(hits.map(gene => gene.id)), [hits]);
  const byId = useMemo(() => new Map(simulation.genes.map(gene => [gene.id, gene])), [simulation.genes]);
  const selected = byId.get(selectedId) ?? simulation.genes[0];
  const normalized = selected.counts.map((value, index) => value / simulation.samples[index].sizeFactor);
  const maxCount = Math.max(...normalized, 1);
  const plotted = useMemo(() => plottableResults(simulation.genes), [simulation.genes]);
  const shown = rows.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const { x: xLimit, y: yLimit } = expandedLimits ?? defaultPlotLimits;
  const plotWidth = compact ? 400 : 690;
  const left = compact ? 52 : 65;
  const right = plotWidth - (compact ? 16 : 65);
  const x = (value: number) => left + (value + xLimit) / (xLimit * 2) * (right - left);
  const y = (value: number) => 310 - value / yLimit * 270;
  const plotPoints = useMemo(() => plotted.flatMap(gene => {
    const fold = gene.log2FoldChange ?? 0;
    const score = plotScore(gene.padj ?? 1);
    return Math.abs(fold) <= xLimit && score <= yLimit
      ? [{ gene, cx: left + (fold + xLimit) / (xLimit * 2) * (right - left), cy: 310 - score / yLimit * 270 }]
      : [];
  }), [plotted, compact, xLimit, yLimit, left, right]);
  const pointMarks = useMemo(() => {
    const renderPoint = ({ gene, cx, cy }: (typeof plotPoints)[number]) => {
      const kind = !hitIds.has(gene.id) ? 'other' : (gene.log2FoldChange ?? 0) < 0 ? 'decrease' : 'increase';
      const className = `simulation-dot simulation-dot-${kind}`;
      return <circle key={gene.id} className={className} cx={cx} cy={cy} r={kind === 'other' ? 1.5 : 2.2} />;
    };
    return <><g>{plotPoints.filter(point => !hitIds.has(point.gene.id)).map(renderPoint)}</g><g>{plotPoints.filter(point => hitIds.has(point.gene.id)).map(renderPoint)}</g></>;
  }, [plotPoints, hitIds]);
  const selectedPoint = plotPoints.find(point => point.gene.id === selectedId);
  const chooseGene = (gene: SimulationGene) => {
    setSelectedId(gene.id);
    if (gene.padj !== null && gene.log2FoldChange !== null &&
      (Math.abs(gene.log2FoldChange) > xLimit || plotScore(gene.padj) > yLimit)) {
      setExpandedLimits(limits => expandPlotLimits(limits ?? defaultPlotLimits, gene));
    }
  };
  const choosePlotPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const clickX = (event.clientX - bounds.left) * plotWidth / bounds.width;
    const clickY = (event.clientY - bounds.top) * 375 / bounds.height;
    let nearest: (typeof plotPoints)[number] | undefined;
    let nearestDistance = 100;
    for (const point of plotPoints) {
      const distance = (point.cx - clickX) ** 2 + (point.cy - clickY) ** 2;
      if (distance < nearestDistance) { nearest = point; nearestDistance = distance; }
    }
    if (nearest) chooseGene(nearest.gene);
  };
  const goToStep = (index: number) => { setActive(index); setPage(0); setFocusRequest(request => request + 1); workspace.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); };
  const reset = () => { goToStep(0); setCompleted(0); setAlpha(0.05); setMinFold(0); setSelectedId('PPP3CA'); setExpandedLimits(null); setPage(0); };
  return <div className="analysis-simulation">
    <div className="simulation-toolbar"><div className="simulation-about">{children}</div><button disabled={completed === 0} onClick={reset}>最初から</button></div>
    <p className="simulation-target-note">shCaN Aα ＝ PPP3CAを標的にノックダウン</p>
    <ol className="simulation-steps" aria-label="解析の手順">{steps.map((item, index) => <li key={item.title}><button disabled={index > completed} aria-current={index === active ? 'step' : undefined} onClick={() => goToStep(index)}><span>{index < completed ? '✓' : String(index + 1).padStart(2, '0')}</span>{item.title}</button></li>)}</ol>
    <section ref={workspace} className="simulation-workspace" aria-label={step.title}>
      <div className="simulation-step-heading"><span>STEP {active + 1} / {steps.length}</span><h2 ref={heading} tabIndex={-1}>{step.title}</h2>{step.description && <p>{step.description}</p>}</div>
      <div className="simulation-terminal"><div className="simulation-terminal-bar"><span>{active === 5 ? 'Shell' : 'R'}</span></div>
        {/* Scrollable command text must be keyboard reachable. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <pre tabIndex={0} role="region" aria-label="実行するコマンド"><code>{step.code}</code></pre>{step.script && <details className="simulation-script"><summary>{step.script}の中身</summary><pre tabIndex={0} role="region" aria-label={`${step.script}の中身`}><code>{scripts[step.script]}</code></pre></details>}<div className="simulation-terminal-actions">{ran ? <span className="simulation-terminal-check" role="img" aria-label="実行完了">✓</span> : <button className="primary" onClick={() => setCompleted(Math.max(completed, active + 1))}>▶ 実行</button>}</div></div>
      <p className="sr-only" role="status">{ran ? `ステップ${active + 1}の結果を表示しました。全${steps.length}ステップ中${completed}ステップ完了。` : ''}</p>
      {ran && <div className="simulation-output">
        <div className="simulation-output-heading"><h3>実行結果</h3><span>✓ STEP {active + 1}</span></div>
        {active === 0 && <><p>{simulation.genes.length.toLocaleString('ja-JP')}行 × {simulation.samples.length}列のカウント表を読み込みました。</p><div className="table-scroll count-table"><table><caption>カウント表 · 先頭6遺伝子</caption><thead><tr><th scope="col">遺伝子</th>{simulation.samples.map(sample => <th scope="col" key={sample.id}>{displaySampleId(sample.id)}</th>)}</tr></thead><tbody>{simulation.genes.slice(0, 6).map(gene => <tr key={gene.id}><th scope="row">{gene.id}</th>{gene.counts.map((count, index) => <td key={index}>{count}</td>)}</tr>)}</tbody></table></div><div className="simulation-downloads"><button onClick={() => downloadCsv('counts.csv', ['gene,' + simulation.samples.map(sample => sample.id).join(','), ...simulation.genes.map(gene => [gene.id, ...gene.counts].join(','))].join('\n') + '\n')} aria-label="カウント表をCSVでダウンロード">カウント表<DownloadIcon /></button><button onClick={() => downloadCsv('samples.csv', ['sample,condition,group', ...simulation.samples.map(sample => `${sample.id},${sample.condition},${sample.group}`)].join('\n') + '\n')} aria-label="サンプル表をCSVでダウンロード">サンプル表<DownloadIcon /></button></div></>}
        {active === 1 && <><p>Controlを基準として、Treatとの差を調べます。</p><div className="table-scroll"><table><caption>サンプルと比較する群</caption><thead><tr><th scope="col">サンプル</th><th scope="col">実際の群</th><th scope="col">condition</th></tr></thead><tbody>{simulation.samples.map(sample => <tr key={sample.id}><th scope="row">{displaySampleId(sample.id)}</th><td>{displayGroup(sample.group)}</td><td><span className={`condition-tag ${sample.condition === 'Treat' ? 'treat' : ''}`}>{sample.condition}</span></td></tr>)}</tbody></table></div></>}
        {active === 2 && <><p>サンプルごとの補正係数を使い、カウントを比べられるようにします。</p><div className="table-scroll"><table><caption>正規化の補正係数</caption><thead><tr><th scope="col">サンプル</th><th scope="col">カウントの合計</th><th scope="col">sizeFactor</th></tr></thead><tbody>{simulation.samples.map(sample => <tr key={sample.id}><th scope="row">{displaySampleId(sample.id)}</th><td>{sample.total.toLocaleString('en-US')}</td><td>{decimal(sample.sizeFactor, 3)}</td></tr>)}</tbody></table></div><p>PPP3CAのカウントを各サンプルのsizeFactorで割ると、次の値になります。</p><div className="table-scroll"><table><thead><tr><th scope="col">PPP3CA</th>{simulation.samples.map(sample => <th scope="col" key={sample.id}>{displaySampleId(sample.id)}</th>)}</tr></thead><tbody><tr><th scope="row">正規化前</th>{byId.get('PPP3CA')?.counts.map((value, index) => <td key={index}>{value}</td>)}</tr><tr><th scope="row">正規化後</th>{byId.get('PPP3CA')?.counts.map((value, index) => <td key={index}>{decimal(value / simulation.samples[index].sizeFactor, 1)}</td>)}</tr></tbody></table></div></>}
        {(active === 3 || active === 4) && <>
          {active === 4 && <><div className="simulation-thresholds" role="group" aria-label="グラフの色分け基準"><label>padj &lt; <select value={alpha} onChange={event => setAlpha(Number(event.target.value))}><option value="0.01">0.01</option><option value="0.05">0.05</option><option value="0.1">0.10</option></select></label><label>|Log2FC| ≥ <select value={minFold} onChange={event => setMinFold(Number(event.target.value))}><option value="0">0</option><option value="0.5">0.5</option><option value="1">1</option><option value="2">2</option></select></label></div><div className="simulation-plot-toolbar"><div className="simulation-plot-legend"><span><i className="simulation-key simulation-key-decrease" />shCaN Aαで減少</span><span><i className="simulation-key simulation-key-increase" />shCaN Aαで増加</span><span><i className="simulation-key simulation-key-other" />条件外</span></div><button onClick={() => setExpandedLimits(limits => limits ? null : expandPlotLimits(defaultPlotLimits, selected))}>{expandedLimits ? 'Zoom IN' : 'Zoom OUT'}</button></div><svg className={`simulation-volcano${compact ? ' compact-chart' : ''}`} viewBox={`0 0 ${plotWidth} 375`} role="img" aria-label={`実測データのボルケーノプロット。横軸はマイナス${xLimit}から${xLimit}、縦軸は0から${yLimit}。遺伝子の詳細は下の表からも選べます。`} onPointerUp={choosePlotPoint}>
            <defs><clipPath id="simulation-plot-clip"><rect x={left} y="40" width={right - left} height="270" /></clipPath></defs>
            {Array.from({ length: 6 }, (_, index) => index * yLimit / 5).map(tick => <g key={tick}><line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke="#dce2d8" /><text x={left - 11} y={y(tick) + 5} textAnchor="end">{tick}</text></g>)}
            <line x1={x(0)} x2={x(0)} y1="40" y2="310" stroke="#abbcaf" />
            <line x1={left} x2={right} y1={y(-Math.log10(alpha))} y2={y(-Math.log10(alpha))} stroke="#a86130" strokeDasharray="5 5" />
            <text x={right} y={y(-Math.log10(alpha)) - 8} textAnchor="end">padj = {alpha}</text>
            {minFold > 0 && [-minFold, minFold].map(tick => <line key={tick} x1={x(tick)} x2={x(tick)} y1="40" y2="310" stroke="#9caaa0" strokeDasharray="4 5" />)}
            {[-xLimit, -xLimit / 2, 0, xLimit / 2, xLimit].map(tick => <text key={tick} x={x(tick)} y="333" textAnchor="middle">{tick}</text>)}
            <text x={(left + right) / 2} y="363" textAnchor="middle">log₂ fold change（shCaN Aα / shControl）</text><text x={compact ? 14 : 18} y="180" transform={`rotate(-90 ${compact ? 14 : 18} 180)`} textAnchor="middle">−log₁₀ padj</text>
            <g clipPath="url(#simulation-plot-clip)">{pointMarks}{selectedPoint && <circle className="simulation-selected-point" cx={selectedPoint.cx} cy={selectedPoint.cy} r="8" />}</g>
          </svg><p className="caption">表示範囲内：{plotPoints.length.toLocaleString('ja-JP')} / {plotted.length.toLocaleString('ja-JP')}遺伝子</p></>}
          <div className="table-scroll count-table"><table><caption>解析結果 · padjの小さい順</caption><thead><tr><th scope="col">遺伝子名</th><th scope="col">baseMean</th><th scope="col">Log2FC</th><th scope="col">p-value</th><th scope="col">padj</th></tr></thead><tbody>{shown.map(gene => <tr key={gene.id} className={selectedId === gene.id ? 'simulation-selected' : ''}><th scope="row"><button onClick={() => chooseGene(gene)} aria-pressed={selectedId === gene.id}>{gene.id}</button></th><td>{decimal(gene.baseMean, 1)}</td><td>{decimal(gene.log2FoldChange)}</td><td>{probability(gene.pvalue)}</td><td>{probability(gene.padj)}</td></tr>)}</tbody></table></div>
          {rows.length > pageSize && <div className="simulation-pages"><button disabled={page === 0} onClick={() => setPage(page - 1)}>前へ</button><span>{page + 1} / {totalPages} ページ</span><button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>次へ</button></div>}
          <div className="simulation-gene" aria-live="polite"><h3>{selected.id}の正規化したカウント</h3><p>Log2FC {decimal(selected.log2FoldChange)} · padj {probability(selected.padj)}</p><div className="simulation-bars">{simulation.samples.map((sample, index) => <div key={sample.id}><span>{displaySampleId(sample.id)}</span><div className="simulation-bar-track"><i style={{ width: `${normalized[index] / maxCount * 100}%`, background: sample.condition === 'Control' ? '#1f6556' : '#a86130' }} /></div><strong>{decimal(normalized[index], 1)}</strong></div>)}</div></div>
          <div className="simulation-downloads"><button onClick={() => downloadCsv('results.csv', resultsCsv(rows))} aria-label="DESeq2の結果をCSVでダウンロード">DESeq2の結果<DownloadIcon /></button></div>
        </>}
        {active === 5 && <AnalysisGsea />}
      </div>}
      {active < steps.length - 1 && <div className="simulation-footer"><button className="primary" disabled={!ran} onClick={() => goToStep(active + 1)}>次へ：{steps[active + 1].title} →</button></div>}
    </section>
  </div>;
}
