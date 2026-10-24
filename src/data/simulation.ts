export type SimulationGene = {
  id: string;
  counts: number[];
  baseMean: number;
  log2FoldChange: number | null;
  pvalue: number | null;
  padj: number | null;
};

export type SimulationData = {
  engine: string;
  contrast: string;
  source: string;
  samples: { id: string; condition: 'Control' | 'Treat'; group: string; total: number; sizeFactor: number }[];
  genes: SimulationGene[];
};

export function filterResults(genes: SimulationGene[], significantOnly: boolean, alpha: number, minFold: number) {
  return genes.filter(gene => !significantOnly || (gene.padj !== null && gene.padj < alpha && gene.log2FoldChange !== null && Math.abs(gene.log2FoldChange) >= minFold))
    .sort((a, b) => (a.padj ?? Infinity) - (b.padj ?? Infinity) || a.id.localeCompare(b.id));
}

export function plottableResults(genes: SimulationGene[]) {
  return genes.filter(gene => gene.padj !== null && gene.padj >= 0 && gene.log2FoldChange !== null && Number.isFinite(gene.log2FoldChange));
}

export function resultsCsv(genes: SimulationGene[]) {
  return ['gene,baseMean,log2FoldChange,pvalue,padj', ...genes.map(gene =>
    [gene.id, gene.baseMean, gene.log2FoldChange, gene.pvalue, gene.padj].map(value => value ?? 'NA').join(','))].join('\n') + '\n';
}

export const steps = [
  { title: 'データImport', description: 'shControlとshCaN Aαの各3サンプルについて、遺伝子ごとのカウントを読み込みます。', code: 'library(DESeq2)\ncounts <- read.csv("counts.csv", row.names = 1, check.names = FALSE)\nsamples <- read.csv("samples.csv", row.names = 1)\nhead(counts)' },
  { title: '比較群の設定', description: 'shControlをControl、shCaN Aαをノックダウン群として比較します。', code: 'samples$condition <- factor(samples$condition, levels = c("Control", "Treat"))\ndds <- DESeqDataSetFromMatrix(\n  countData = counts, colData = samples, design = ~ condition\n)\ncolData(dds)' },
  { title: '正規化・検定', description: 'サンプル間の読み取り量の違いやばらつきを考慮して、発現量の差を調べます。', code: 'dds <- DESeq(dds)\nsizeFactors(dds)\ncounts(dds, normalized = TRUE)["PPP3CA", ]' },
  { title: '結果表を見る', description: 'ノックダウン群 / Controlの結果を、調整済みp値の小さい順に表示します。', code: 'res <- results(dds, contrast = c("condition", "Treat", "Control"), alpha = 0.05)\nres <- res[order(res$padj), ]\nres[, c("baseMean", "log2FoldChange", "pvalue", "padj")]' },
  { title: 'ボルケーノプロット', code: 'plot(res$log2FoldChange, -log10(res$padj),\n  xlab = "log2 fold change (shCaN Aα / shControl)",\n  ylab = "-log10 adjusted p-value", pch = 19,\n  xlim = c(-2, 2), ylim = c(0, 25))\nabline(h = -log10(0.05), lty = 2)' },
  { title: 'GSEAで遺伝子セットを見る', description: 'E2F1に関係する3つの遺伝子セットについて、順位と曲線を確認します。', code: 'python data/analysis/gsea-source/run_gsea.py', script: 'run_gsea.py' },
];
