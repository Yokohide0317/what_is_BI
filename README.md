# what_is_BI

データ解析の読み方を学ぶ静的教材。トップページから解析テーマを選べます。現在はRNA-seqを掲載しています。
序論では、冬・夏の売上金額とレシピ集から食卓の変化を考えます。続くRNA-seqの解説では、遺伝子、RNA-seq、ボルケーノプロット、GSEAを扱います。解析体験では、コマンドに沿って操作し、事前に計算した表やグラフを確認できます。

## 公開ページ

- サイト: https://what-is-bi.pages.dev/
- Google Colab:
  - [01 RNA-seq のデータを見てみる](https://colab.research.google.com/github/Yokohide0317/what_is_BI/blob/main/public/colab/01_Introduction.ipynb)
  - [02 PCA: 試料の品質と、試料どうしの類似性](https://colab.research.google.com/github/Yokohide0317/what_is_BI/blob/main/public/colab/02_QC_PCA.ipynb)
  - [03 DESeq2 で2つの条件を比較する](https://colab.research.google.com/github/Yokohide0317/what_is_BI/blob/main/public/colab/03_DESeq2.ipynb)
  - [04 結果を図にする](https://colab.research.google.com/github/Yokohide0317/what_is_BI/blob/main/public/colab/04_Visualization.ipynb)
  - [05 遺伝子のまとまりで見る（GSEA）](https://colab.research.google.com/github/Yokohide0317/what_is_BI/blob/main/public/colab/05_GSEA.ipynb)

## 開発

Node.js 22.23.4以上を使用します。

```sh
npm ci
npm run dev
```

Astro + MDXで本文、React + SVGで操作教材を構成しています。
トップは `src/pages/index.astro`（`/`）、序論は `src/pages/rna-seq/introduction.mdx`（`/rna-seq/introduction/`）、RNA-seqの解説は `src/pages/rna-seq.mdx`（`/rna-seq/`）です。操作部品は `src/components/`、解説用の人工データは `src/data/` にあります。
解析体験は `src/pages/simulation.astro`（`/simulation/`）です。6段階の実行、遺伝子の選択、CSV保存に対応しています。最後の段階では、論文の図5C–Eと同じ遺伝子セットのGSEA曲線を表示し、セット内遺伝子の位置を調べられます。
JavaScriptが無効でも本文・表・静止図・要約が読めます。動きを減らす設定では自動ステップ再生を無効にします。

## 確認

```sh
npm test
npm run lint
npm run check
npm run build
npm run preview
```

GitHub Actionsでもテスト・ESLint（TS/TSXとJSXアクセシビリティ）・Astro型検査・静的ビルドを実行します。
`dist/` が出力先です。Cloudflare Pages等ではビルドコマンド `npm run build`、出力先 `dist` を指定できます。
このリポジトリにデプロイの自動化・外部サービス設定は含めていません。
本文フォントはGoogle Fontsから取得し、接続できない場合はシステムフォントで表示します。
