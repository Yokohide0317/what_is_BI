# AGENTS.md

## 日本語を書く・レビューする

本文、UI、README、PR説明の日本語を書く・レビューするときは、[natural-japanese の SKILL.md](.agents/skills/natural-japanese/SKILL.md)を読んで、そこにあるレビュー手順を使う。

- 科学的な意味、数値データ、不確実性を変えない。
- 元の文書にない事実・意見・確信を足さない。
- マーケティング文句や追加の案内文を足さず、日本語を使う。

検査スクリプトは `uv` で実行する。

```sh
uv run .agents/skills/natural-japanese/scripts/lint.py path/to/draft.md --genre tech
```

Python の lint と検査スクリプトは補助ツールであり、npm の静的ビルドには必要ない。
