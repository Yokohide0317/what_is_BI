# ikra の output.tsv (scaledTPM) と実験表から DESeq2 の入力を作る
tx <- read.delim("../output.tsv", row.names = 1, check.names = FALSE)
write.csv(round(as.matrix(tx)), "counts.csv")

exp <- read.csv("../experiment_table.csv")
samples <- data.frame(
  row.names = exp$name,
  condition = ifelse(exp$condition == "shControl", "Control", "Treat"),
  group = exp$condition
)
stopifnot(identical(rownames(samples), colnames(tx)))
write.csv(samples, "samples.csv")
