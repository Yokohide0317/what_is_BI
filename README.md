# what_is_BI

医学部1年生から読める、遺伝子セットと解析の読み方の静的教材。
序論のページでは、冬・夏の売上金額とレシピ集から食卓の変化を考えます。次のRNA-seqのページで、遺伝子、RNA-seq、ボルケーノプロット、GSEAを解説します。解説は全体で8章です。続く解析体験ページでは、コマンドに沿って操作し、事前に計算した表やグラフを確認できます。

## 開発

Node.js 22.23.4以上を使用します。

```sh
npm ci
npm run dev
```

Astro + MDXで本文、React + SVGで操作教材を構成しています。
序論は `src/pages/index.mdx`（`/`）、RNA-seqの解説は `src/pages/rna-seq.mdx`（`/rna-seq/`）です。操作部品は `src/components/`、解説用の人工データは `src/data/` にあります。
解析体験は `src/pages/simulation.astro`（`/simulation/`）です。6段階の実行、結果の絞り込み、遺伝子の選択、CSV保存、最初からの再実行に対応しています。最後の段階では、論文の図5C–Eと同じ遺伝子セットのGSEA曲線を表示し、セット内遺伝子の位置を調べられます。
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

## 日本語の本文を確認する

本文、UI、README、PR説明の日本語を書く・レビューするときは、[natural-japanese の SKILL.md](.agents/skills/natural-japanese/SKILL.md)を読み、そこにあるレビュー手順を使います。科学的な意味、数値データ、不確実性は変えません。

補助的な日本語検査は `uv` で実行できます。

```sh
uv run .agents/skills/natural-japanese/scripts/lint.py path/to/draft.md --genre tech
```

導入元と固定した upstream commit は[導入元情報](.agents/skills/natural-japanese/UPSTREAM.md)に記録しています。

## 教材データ

- 解析体験はSatoらの研究で参照されたDRA011729の6サンプルを使います。`data/analysis/` にR/DESeq2の入力と結果を保管し、`uv run scripts/generate_simulation.py` で `public/data/simulation.json` を作ります。ブラウザーではRを再実行せず、19,705遺伝子の結果を読み込みます。元の入力表はSalmonのscaledTPMを整数に丸めたもので、生のリード数ではありません。`make_inputs.R` と `run_deseq2.R` に作成・解析手順があります。
- GSEAの再解析手順は `data/analysis/gsea-source/run_gsea.py` にあります。`uv run data/analysis/gsea-source/run_gsea.py` で順位表と解析結果を作り、`python3 scripts/generate_gsea_simulation.py` で `public/data/gsea.json` を作ります。図5C–Eと同じ3セットですが、NESとFDRは論文掲載値とは異なります。遺伝子セットは[MSigDB 2024.1.Hs（CC BY 4.0）](https://www.gsea-msigdb.org/gsea/msigdb_license_terms.jsp)に基づきます。
- スーパーの121商品の売上金額は架空です。同じ店舗の冬・夏、各30日間の金額を円で表示します。最初は金額だけを見て、次にレシピの材料を色づけします。夏÷冬の倍率と増減率を図で確認した後、増減率順に並べてカレーの材料を見ます。レシピは調味料や薬味を含む一例です。序論だけで使い、p値は計算しません。
- RNA-seqの解説ページにあるカウント表・ボルケーノ・GSEAの順位曲線は、同じ48遺伝子の人工発現量を使います。生のRNA-seqカウントではありません。この解説図ではGSEAのNES/FDRを計算しません。
- ボルケーノの48遺伝子は人工データです。各条件6反復、固定シードの生成条件、全924通りの両側置換検定、全48検定のBH補正を `scripts/generate_demo.py` に記述しています。図内にも条件を掲載しています。
- `python3 scripts/generate_demo.py` で `src/data/genes.json` を再生成できます（Python標準ライブラリのみ）。正規化済みの実測RNA-seqデータではなく、RNA-seqの解析手順を代替するものではありません。
- 原論文の説明は Sato et al., PNAS 121, e2414618121 (2024), Figure 5 の本文・図注に基づきます。図は転載せず、原文へリンクしています。RNA-seq解析体験ではDRA011729から作成されたDESeq2の結果を使います。GSEAの画面では3セットのうち順位表に存在する遺伝子を表示し、MSigDBの全データベースは含めていません。

実際の公開判断には、科学的内容の専門家レビューと初学者の試読が必要です。
