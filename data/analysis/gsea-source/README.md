# 原論文 図5C–EのGSEA再現

Sato et al., PNAS 121, e2414618121 (2024) の図5C–Eを、`data/analysis/` のDESeq2入力から再現した結果です。

```sh
python data/analysis/gsea-source/run_gsea.py
```

実行にはgseapy 1.3とpandasが必要です。

MSigDBのGMTファイルは `~/.cache/what_is_BI/msigdb/` にダウンロードし、このディレクトリには置きません。

## ファイル

- `run_gsea.py`：再現用スクリプト。
- `ranked_genes.tsv`：順位をつけた全17,155遺伝子（`rank`、`gene`、`signal_to_noise`）。
- `gsea_fig5.json`：3つの遺伝子セットのES、NES、名目p値、FDR、山または谷の順位、セット内遺伝子の順位（`hits`）、leading-edge、running ESの頂点（`curveVertices`）。

`curveVertices` は `[順位, running ES]` の組です。セット外の遺伝子では一定量ずつ下がるので、頂点を直線でつなぐと曲線を正確に描けます。

## 方法

- 入力：`counts.csv` をDESeq2のサイズファクターで割った正規化カウント。6試料のどれかで0より大きい遺伝子だけを使う。`counts.csv` はSalmonのscaledTPMを整数に丸めたもので、生のリード数ではない。
- 遺伝子ID：`counts.csv` と同じHGNC遺伝子名（GENCODE v37）。
- 遺伝子セット：MSigDB 2024.1.Hs のHallmarkとC6。
- 計算：gseapy 1.3 の `gsea()`。順位づけはsignal-to-noise、重みは1、置換は遺伝子セットの置換を1000回（seed 1）。セットの大きさは15〜500。HallmarkとC6をまとめて検定し、FDRを計算した。
- 向き：signal-to-noiseが正なら、shPPP3CA（Treat）で高い。1位はTreatで最も増えた側。NESが負なら、Treatで下がった側に偏る。
- gseapy 1.3 は、GSEAデスクトップ版と同じく標準偏差の下限（平均の絶対値の0.2倍）を使う。このため、signal-to-noiseは±5に収まる。1.1では下限がなく、結果が変わる。

## 原論文との比較

| 図 | 遺伝子セット | 原論文 NES / FDR / P | 再現 ES / NES / FDR / P |
|---|---|---|---|
| 5C | HALLMARK_E2F_TARGETS | −2.34 / <0.001 / <0.001 | −0.596 / −2.80 / <0.001 / <0.001 |
| 5D | E2F1_UP.V1_UP | −1.22 / 0.183 / 0.055 | −0.308 / −1.42 / 0.069 / 0.010 |
| 5E | E2F1_UP.V1_DN | 1.54 / 0.013 / 0.002 | 0.459 / 1.93 / <0.001 / <0.001 |

- 曲線の形と向きは、3つとも原論文の図と同じ。ESは、原論文の図の縦軸から読める値（5Cで約−0.6、5Dで約−0.33、5Eで約0.43）とほぼ一致する。
- NESの絶対値は原論文より大きく、5Dと5Eではp値とFDRも小さい。NESとFDRは置換で作る分布、検定したセットの範囲、MSigDBのバージョンで変わる。原論文の入力や設定は補足資料にあり、ここでは確認していない。
- 3対3で試料のラベルを入れ替える置換では、組み合わせが20通りしかなく、p値は約0.1より小さくならない。原論文のP < 0.001と合わないため、遺伝子セットの置換を使った。
- 全遺伝子の約8.6%は、signal-to-noiseが同じ値（主に±5）になる。同じ値の遺伝子の並び順は一意に決まらない。
