import { useEffect, useMemo, useState } from 'react';
import '../styles/simulation-gsea.css';

type GseaHit = { rank: number; gene: string; metric: number; leadingEdge: boolean };
type GseaSet = {
  name: string;
  figure: string;
  size: number;
  ES: number;
  NES: number;
  nominalP: number;
  FDR: number;
  peakRank: number;
  hits: GseaHit[];
  curveVertices: [number, number][];
};
type GseaData = { genes: number; rankMetric: [number, number][]; sets: GseaSet[] };

const width = 760;
const left = 66;
const right = 733;
const scoreZero = 132;
const scoreAmplitude = 96;
const tickTop = 248;
const tickBottom = 274;
const metricZero = 340;
const metricAmplitude = 43;
const smallP = (value: number) => value === 0 ? '<0.001' : value < 0.00001 ? value.toExponential(2) : value < 0.001 ? value.toFixed(5) : value.toFixed(3);

export default function AnalysisGsea() {
  const [data, setData] = useState<GseaData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let mounted = true;
    fetch('/data/gsea.json').then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<GseaData>;
    }).then(value => { if (mounted) setData(value); }).catch(() => { if (mounted) setError(true); });
    return () => { mounted = false; };
  }, []);
  if (error) return <p role="alert">GSEAの結果を読み込めませんでした。ページを再読み込みしてください。</p>;
  if (!data) return <p role="status">GSEAの結果を読み込んでいます。</p>;
  return <GseaResults data={data} />;
}

function GseaResults({ data }: { data: GseaData }) {
  const [setIndex, setSetIndex] = useState(0);
  const [selectedRank, setSelectedRank] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [leadingOnly, setLeadingOnly] = useState(false);
  const current = data.sets[setIndex];
  const selected = current.hits.find(hit => hit.rank === selectedRank) ?? null;
  const x = (rank: number) => left + rank / data.genes * (right - left);
  const maxScore = Math.max(Math.abs(current.ES) * 1.2, 0.2);
  const scoreY = (value: number) => scoreZero - value / maxScore * scoreAmplitude;
  const scorePath = current.curveVertices.map(([rank, score], index) => `${index ? 'L' : 'M'}${x(rank).toFixed(2)},${scoreY(score).toFixed(2)}`).join(' ');
  const metricPath = data.rankMetric.map(([rank, metric], index) => `${index ? 'L' : 'M'}${x(rank).toFixed(2)},${(metricZero - Math.max(-3, Math.min(3, metric)) / 3 * metricAmplitude).toFixed(2)}`).join(' ');
  const selectedScore = selected ? current.curveVertices.find(([rank]) => rank === selected.rank)?.[1] : undefined;
  const listed = useMemo(() => current.hits.filter(hit =>
    (!leadingOnly || hit.leadingEdge) && hit.gene.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  ), [current, leadingOnly, query]);
  const selectSet = (index: number) => { setSetIndex(index); setSelectedRank(null); setQuery(''); setLeadingOnly(false); };
  const pickPlotHit = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const plotX = (event.clientX - bounds.left) * width / bounds.width;
    const plotY = (event.clientY - bounds.top) * 425 / bounds.height;
    if (plotY < tickTop - 12 || plotY > tickBottom + 12) return;
    let nearest: GseaHit | null = null;
    let distance = 12;
    for (const hit of current.hits) {
      const next = Math.abs(plotX - x(hit.rank));
      if (next < distance) { nearest = hit; distance = next; }
    }
    if (nearest) setSelectedRank(nearest.rank);
  };
  return <div className="simulation-gsea">
    <div className="simulation-gsea-tabs" aria-label="遺伝子セット">
      {data.sets.map((item, index) => <button key={item.name} type="button" aria-pressed={setIndex === index} onClick={() => selectSet(index)}><small>Fig. {item.figure}</small>{item.name}</button>)}
    </div>
    <div className="simulation-gsea-summary">
      <div><span>ES</span><strong>{current.ES.toFixed(3)}</strong></div>
      <div><span>NES</span><strong>{current.NES.toFixed(2)}</strong></div>
      <div><span>p値</span><strong>{smallP(current.nominalP)}</strong></div>
      <div><span>FDR q値</span><strong>{smallP(current.FDR)}</strong></div>
      <div><span>順位表にあるセット内遺伝子</span><strong>{current.size} / {data.genes.toLocaleString('ja-JP')}</strong></div>
    </div>
    <details className="simulation-gsea-method">
      <summary>ESとNESの求め方</summary>
      <p>まず全{data.genes.toLocaleString('ja-JP')}遺伝子を、signal-to-noise（shCaN Aαの平均 − shControlの平均を、両群の標準偏差の和で割った値）の大きい順に並べます。左（1位）から順に、セット内の遺伝子ではsignal-to-noiseの絶対値に比例した量を足し、セット外の遺伝子では一定の量を引きます。この累積スコアが図の曲線で、0から最も離れた値がES（エンリッチメントスコア）です。ESが正ならセットは左側（shCaN Aαで多い側）に、負なら右側（shControlで多い側）に偏っています。</p>
      <p>ESはセットの大きさによって変わるので、そのままではセット同士を比べられません。そこで、同じ数の遺伝子を無作為に選んだセットでESを1,000回計算し、観測したESを、同じ符号の無作為なESの平均（絶対値）で割ります。これがNES（正規化エンリッチメントスコア）です。p値は、無作為なセットで観測以上に極端なESが出た割合です。FDR q値は、検定したHallmarkとC6の全セットのNESをもとに、NESの絶対値がそれ以上のセットを選んだときに誤った発見が含まれる割合を推定した値です。</p>
    </details>
    <div className="simulation-gsea-legend"><span><i className="gsea-legend-hit" />セット内の遺伝子</span><span><i className="gsea-legend-core" />leading edge</span></div>
    <svg className="simulation-gsea-chart" viewBox="0 0 760 425" role="img" aria-label={`${current.name}のGSEA曲線。${current.ES < 0 ? '右側、shControlで多い遺伝子に偏る' : '左側、shCaN Aαで多い遺伝子に偏る'}。縦線はセット内遺伝子の位置。遺伝子名は下の一覧で確認できます。`} onPointerUp={pickPlotHit}>
      <rect x={left} y="30" width={right - left} height="182" fill="#f7f8f4" />
      <rect x={left} y={tickTop - 5} width={right - left} height="36" fill="#f1f3eb" />
      <rect x={left} y="292" width={right - left} height="96" fill="#f7f8f4" />
      <line x1={left} x2={right} y1={scoreZero} y2={scoreZero} stroke="#bcc9bc" />
      <line x1={left} x2={right} y1={metricZero} y2={metricZero} stroke="#bcc9bc" />
      <path d={scorePath} fill="none" stroke="#177260" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={metricPath} fill="none" stroke="#899c8e" strokeWidth="1.2" opacity="0.8" />
      {current.hits.map(hit => <line key={hit.rank} x1={x(hit.rank)} x2={x(hit.rank)} y1={tickTop} y2={tickBottom} stroke={hit.leadingEdge ? '#b76b35' : '#5a7165'} strokeWidth={selectedRank === hit.rank ? 3.5 : 1.5} opacity={selectedRank === hit.rank ? 1 : 0.85} />)}
      {selected && <><line x1={x(selected.rank)} x2={x(selected.rank)} y1="30" y2="388" stroke="#a2542b" strokeWidth="1.5" strokeDasharray="5 4" />{selectedScore !== undefined && <circle cx={x(selected.rank)} cy={scoreY(selectedScore)} r="5" fill="#a2542b" stroke="#fff" strokeWidth="2" />}</>}
      <text x="27" y="130" transform="rotate(-90 27 130)" textAnchor="middle">エンリッチメントスコア</text>
      <text x="27" y="342" transform="rotate(-90 27 342)" textAnchor="middle">順位指標</text>
      <text x={left - 8} y={scoreZero + 5} textAnchor="end">0</text>
      <text x={left - 8} y={metricZero + 5} textAnchor="end">0</text>
      {[0, 0.25, 0.5, 0.75, 1].map(fraction => <g key={fraction}><line x1={x(fraction * data.genes)} x2={x(fraction * data.genes)} y1="388" y2="395" stroke="#65776c" /><text x={x(fraction * data.genes)} y="412" textAnchor="middle">{Math.round(fraction * data.genes).toLocaleString('ja-JP')}</text></g>)}
    </svg>
    <div className="simulation-gsea-ends"><span>← shCaN Aαで多い</span><span>順位：{data.genes.toLocaleString('ja-JP')}遺伝子</span><span>shControlで多い →</span></div>
    <div className="simulation-gsea-gene-heading"><h4>セットに含まれる遺伝子</h4></div>
    <div className="simulation-gsea-controls"><input type="search" aria-label="遺伝子名で探す" value={query} onChange={event => setQuery(event.target.value)} placeholder="例：E2F1" /><label><input type="checkbox" checked={leadingOnly} onChange={event => setLeadingOnly(event.target.checked)} />leading edgeだけ</label></div>
    <p className="simulation-gsea-result-count" role="status">{listed.length} / {current.hits.length}遺伝子</p>
    <div className="simulation-gsea-gene-list" aria-label="セット内遺伝子">{listed.map(hit => <button key={hit.rank} type="button" aria-pressed={selectedRank === hit.rank} onClick={() => setSelectedRank(hit.rank)}><strong>{hit.gene}</strong><span>{hit.rank.toLocaleString('ja-JP')}位</span>{hit.leadingEdge && <em>leading edge</em>}</button>)}</div>
    {listed.length === 0 && <p>該当する遺伝子はありません。</p>}
    {selected && <div className="simulation-gsea-selected" aria-live="polite"><strong>{selected.gene}</strong><span>{selected.rank.toLocaleString('ja-JP')} / {data.genes.toLocaleString('ja-JP')}位</span><span>順位指標 {selected.metric.toFixed(3)}</span><span>{selected.leadingEdge ? 'leading edge' : 'セット内'}</span></div>}
  </div>;
}
