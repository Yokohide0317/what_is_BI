# what_is_BI

医学部1年生から読める、遺伝子セットと解析の読み方の静的教材。
スーパーの例から、shRNA、RNA-seq、ボルケーノプロット、GSEA、原論文の図5へ進む1記事です。

## 開発

Node.js 22.14以上を使用します。

```sh
npm ci
npm run dev
```

Astro + MDXで本文、React + SVGで操作教材を構成しています。
本文は `src/pages/index.mdx`、操作部品は `src/components/`、データは `src/data/` です。
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

## 教材データ

- スーパーの12商品とセットは架空です。割合と順位の模式例であり、p値や実際のGSEAのNES/FDRは計算しません。
- ボルケーノの48遺伝子は人工データです。各条件6反復、固定シードの生成条件、全924通りの両側置換検定、全48検定のBH補正を `scripts/generate_demo.py` に記述しています。図内にも条件を掲載しています。
- `python3 scripts/generate_demo.py` で `src/data/genes.json` を再生成できます（Python標準ライブラリのみ）。正規化済みの実測RNA-seqデータではなく、RNA-seqの解析手順を代替するものではありません。
- 原論文の説明は Sato et al., PNAS 121, e2414618121 (2024), Figure 5 の本文・図注に基づきます。図は転載せず、原文へリンクしています。DRA011729の取り込み・再解析や、MSigDBセットの再配布はしていません。

実際の公開判断には、科学的内容の専門家レビューと初学者の試読が必要です。