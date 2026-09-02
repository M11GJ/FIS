# FIS MCP

FISは、情報科学部の卒業要件・科目データ・履修可否・時間割・進行リスク判定を、ログイン不要のMCP Streamable HTTPとして公開します。MCPは読み取り専用・ステートレスで、入力された履修情報を保存しません。

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
- `search_courses`: 入学年度別の科目を検索し、2026年度の開講期・曜日・時限・授業形態・確認済み先修条件を取得
- `check_course_eligibility`: 学生年次、先修条件、既修得、年間48単位上限、同時計画科目との重複から履修可否を判定
- `check_schedule_conflicts`: 同じ開講期間・曜日・時限の科目を検出。オンデマンドは除外し、集中講義・未定は要確認として返却
- `assess_progression_risk`: 専門ゼミ1と卒業研究の履修条件を満たすか確認し、4年卒業が遅れる可能性を説明
- `check_graduation`: 科目IDまたは完全な科目名から卒業要件を判定
- `plan_remaining_courses`: 残り必修を配当年次別に整理し、不足単位と選択候補を取得

大量応答を避けるため、`search_courses`は既定50件、`plan_remaining_courses`の選択候補は既定30件です。必要な場合だけ`offset`・`limit`または`electiveCandidateLimit`を指定してください。

`check_graduation` の入力例です。

```json
{
  "entryYear": 2026,
  "program": "DS",
  "completedCourses": ["c_12345678", "情報科学概論"]
}
```

科目名が一致しない入力は `unmatchedCourses` に分離されます。AIは推測で履修済みにせず、不一致を利用者へ確認できます。

## 年度と年次の区別

- `entryYear`: 入学年度。2024・2025・2026年度の学生便覧と卒業要件を選びます。
- `academicYear`: 実際の開講年度。曜日・時限・授業形態・シラバスの先修条件は現在2026年度だけを収録しています。
- `studentYear`: 情報科学部での現在年次。便覧上、修得状況で定義されるため、`academicYear - entryYear + 1`から自動決定しません。

配当年次は「履修できる最低学年」として扱います。たとえば2年以上の科目は、4年次でも、先修条件・時間重複・既修得・年間履修上限に問題がなければ原則履修可能です。

## 先修条件と進行条件

2026年度の公式シラバスで確認した先修条件を、出典URL・確認日付きのルールとして保持します。収録済みの主な系列は次のとおりです。

- コミュニケーション英語Ⅱ: Ⅰが必須
- コミュニケーション英語Ⅲ: Ⅰ・Ⅱが必須
- コミュニケーション英語Ⅳ: Ⅰ・Ⅱ・Ⅲが必須
- Python応用、データの可視化: Python入門が必須
- データベース応用: データベースが必須
- オブジェクト指向プログラミング、ソフトウェア工学: 推奨先修科目を警告として返却

専門ゼミ1には、学科基礎必修16単位の全修得、いずれか1プログラムの必修8単位の全修得、合計64単位以上が必要です。卒業研究には専門ゼミ1・2の両方が必要です。`assess_progression_risk`はこれらを決定論的に確認しますが、「留年」を確定せず、専門ゼミ・卒業研究・4年卒業が遅れる可能性として返します。

すべてのシラバス本文を収録しているわけではありません。ルール未登録科目は、科目表の配当年次と時間割から判定し、先修条件は未検証と明示します。毎年度、公式シラバスをオフラインで照合してスナップショットを更新し、MCP要求中にActive Academyへスクレイピングは行いません。

## 個人データとの境界

MCPにはDCC Loginを接続していません。氏名、学籍番号、DCCの `sub`、保存済みクラウド履修情報を返すツールもありません。AIへ渡す履修科目は利用者またはMCPクライアントがその都度指定し、FISは判定結果だけ返します。

DCC Loginによる保存は同一Webアプリ内の `/api/me/course-profile` に分離されています。MCPからこのAPIは呼べません。

## 運用

DCC Gitの「動的サイト」公開では、リポジトリ直下の `Dockerfile` または `npm start` がWeb・API・MCPを単一プロセスで起動します。どちらも内部ポート3000を使用します。履修情報を再デプロイ後も保持するには `/data` を永続storageとして設定します。

ローカルの `docker compose up --build` は `docker-compose.override.yml` を自動的に読み込み、WebとAPIを分けた開発用構成を使用します。本番設定は次のとおりです。

- `VITE_DCC_CLIENT_ID`: DCC Loginで登録したPublic Client ID。バックエンドでもAccess Tokenの`client_id`照合に同じ値を使用
- `VITE_DCC_REDIRECT_URI`: `https://fis--gunn0511.shu-dcc.net/shu-binran/`（登録済みRedirect URIと完全一致させる）
- `FIS_ALLOWED_HOSTS`: `.shu-dcc.net` 以外の追加公開ホストをカンマ区切りで指定

保存ファイルはコンテナ内の `/data/course-profiles.json` です。`/data` はDCC Gitの公開画面で永続storageとして設定し、バックアップ・アクセス権はホスティング側で管理してください。

## 将来MCPをDCC Login必須にする場合

全体または個人データ用ツールだけをOAuth必須にできます。実装時は、MCPの保護リソースメタデータ、OAuth 2.1 Authorization Code + PKCE、`resource`に対応したAudience、JWTの署名・Issuer・Audience・Scope検証が必要です。Web画面用OIDCクライアントとMCPクライアントはRedirect URIが異なるため、別登録にします。現バージョンでは検討事項であり、MCPは匿名のままです。
