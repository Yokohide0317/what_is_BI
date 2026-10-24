library(DESeq2)
counts <- read.csv("counts.csv", row.names = 1, check.names = FALSE)
samples <- read.csv("samples.csv", row.names = 1)
head(counts)
write.csv(head(counts), "01_head_counts.csv")

samples$condition <- factor(samples$condition, levels = c("Control", "Treat"))
dds <- DESeqDataSetFromMatrix(
  countData = counts, colData = samples, design = ~ condition
)
colData(dds)
write.csv(as.data.frame(colData(dds)), "02_colData.csv")

dds <- DESeq(dds)
sizeFactors(dds)
write.csv(data.frame(sizeFactor = sizeFactors(dds)), "03_sizeFactors.csv")
counts(dds, normalized = TRUE)["PPP3CA", ]
write.csv(data.frame(normalized_count = counts(dds, normalized = TRUE)["PPP3CA", ]),
          "04_normalized_counts_PPP3CA.csv")

res <- results(dds, contrast = c("condition", "Treat", "Control"), alpha = 0.05)
res <- res[order(res$padj), ]
res[, c("baseMean", "log2FoldChange", "pvalue", "padj")]
write.csv(as.data.frame(res[, c("baseMean", "log2FoldChange", "pvalue", "padj")]),
          "05_results.csv")
