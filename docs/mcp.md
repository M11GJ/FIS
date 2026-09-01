# FIS MCP

FISは、情報科学部の卒業要件・科目データ・判定機能を、ログイン不要のMCP Streamable HTTPとして公開します。MCPは読み取り専用・ステートレスで、入力された履修情報を保存しません。

## エンドポイント

```text
https://fis--gunn0511.shu-dcc.net/mcp
```

ローカルのDocker Composeでは次のURLです。

```text
http://localhost:8080/shu-binran/mcp
```

MCPクライアントには、上記URLをStreamable HTTPサーバーとして登録してください。認証ヘッダーは不要です。

## ツール

- `list_supported_entry_years`: 対応する入学年度を取得
- `get_graduation_requirements`: 年度・プログラム別の要件を取得
- `search_courses`: 年度別の科目を検索（`offset`・`limit`で最大200件まで取得可能）
- `check_graduation`: 科目IDまたは完全な科目名から卒業要件を判定
- `plan_remaining_courses`: 残り必修を配当年次別に整理し、不足単位と選択候補を取得

`check_graduation` の入力例です。

```json
{
  "entryYear": 2026,
  "program": "DS",
  "completedCourses": ["c_12345678", "情報科学概論"]
}
```

科目名が一致しない入力は `unmatchedCourses` に分離されます。AIは推測で履修済みにせず、不一致を利用者へ確認できます。

## 個人データとの境界

MCPにはDCC Loginを接続していません。氏名、学籍番号、DCCの `sub`、保存済みクラウド履修情報を返すツールもありません。AIへ渡す履修科目は利用者またはMCPクライアントがその都度指定し、FISは判定結果だけ返します。

DCC Loginによる保存は同一Webアプリ内の `/api/me/course-profile` に分離されています。MCPからこのAPIは呼べません。

## 運用

DCC Gitのサーバーアプリ公開では、リポジトリ直下の `Dockerfile` がWeb・API・MCPを単一コンテナで起動します。公開先は内部ポート80を指定し、履修情報を再デプロイ後も保持するには `/data` を永続storageとして設定します。

ローカルの `docker compose up --build` は `docker-compose.override.yml` を自動的に読み込み、WebとAPIを分けた開発用構成を使用します。本番設定は次のとおりです。

- `VITE_DCC_CLIENT_ID`: DCC Loginで登録したPublic Client ID。バックエンドのAudience検証にも同じ値を使用
- `VITE_DCC_REDIRECT_URI`: `https://fis--gunn0511.shu-dcc.net/shu-binran/`（登録済みRedirect URIと完全一致させる）
- `FIS_ALLOWED_HOSTS`: `.shu-dcc.net` 以外の追加公開ホストをカンマ区切りで指定

保存ファイルはコンテナ内の `/data/course-profiles.json` です。`/data` はDCC Gitの公開画面で永続storageとして設定し、バックアップ・アクセス権はホスティング側で管理してください。
