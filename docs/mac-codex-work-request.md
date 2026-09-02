# FIS 2.0.3 本番完成作業依頼書（Mac版Codex向け）

## 1. 依頼の目的

周南公立大学の単位チェックシステムFISについて、以下をDCC Git本番環境で実際に利用できるところまで修正・検証してください。

1. 情報科学部の2024・2025・2026年度入学生を切り替えて卒業要件を判定できること
2. ログインなしで単位チェックと匿名・読み取り専用MCPを利用できること
3. DCC Loginは、利用者が履修情報をクラウド保存・同期するときだけ任意で利用すること
4. DCC Hubのiframe内からDCC Loginを開始し、認証完了後にFISへ戻れること
5. Web、API、MCP、DCC Login保存APIをDCC Gitの同じ公開先で動作させること
6. GitHubとDCC Gitの`main`を同一コミットに保ち、DCC Git側でホスティングすること

コードが存在するだけでは完了とせず、公開URLへの実通信とブラウザ操作で全項目を確認してください。

## 2. リポジトリと公開先

- ローカル作業対象: FISリポジトリ
- GitHub: `git@github.com:M11GJ/FIS.git`
- DCC Git: `https://git.shu-dcc.net/gunn0511/FIS.git`
- ブランチ: `main`
- 引継ぎ対象の実装コミット: `737dac4680c966cd2471f44579ba1b3a3c7fdccc`
- 引継ぎ時点のバージョン: `2.0.3`
- FIS実体オリジン: `https://fis--gunn0511.shu-dcc.net/`
- DCC Hub上の表示URL: `https://app.shu-dcc.net/shu-binran/`
- MCP予定URL: `https://fis--gunn0511.shu-dcc.net/mcp`
- Health予定URL: `https://fis--gunn0511.shu-dcc.net/api/health`

DCC GitのアクセストークンやClient Secretをソース、依頼書、コミット、ログへ書かないでください。DCC LoginはSPA/Public Clientであり、Client Secretは使用しません。

## 3. 現在までに実装済みの内容

### 入学年度と卒業判定

- 対応年度: 2024、2025、2026
- 対応プログラム: DS、IE、BA
- 年度別科目数: 2024年143件、2025年143件、2026年147件
- 2026年度だけに追加される科目:
  - オブジェクト指向プログラミング
  - 応用数値解析
  - データベース応用
  - 金融工学
- 3年度とも卒業要件は、総計124単位、総合必修19、専門基礎・専門80、実践英語4、選択プログラム22（うち必修8）、演習必修8、他学部4。卒業論文合格は別途必要。
- 学生便覧の比較対象:
  - `（情報科学部）2024年度入学生用学生便覧.pdf`
  - `令和7(2025)年度入学生学生便覧.pdf`
  - `令和8(2026)年度入学生学生便覧.pdf`

### MCP

Streamable HTTPの匿名・読み取り専用MCPを実装済みです。履修入力はMCP内で保存しません。

提供ツールは次の5個です。

1. `list_supported_entry_years`
2. `get_graduation_requirements`
3. `search_courses`
4. `plan_remaining_courses`
5. `check_graduation`

`search_courses`は`offset`と`limit`（最大200）に対応し、年度ごとの全科目を取得できます。

### DCC Login保存

- Client ID: `dcc_fy43DvLjb9qCQCiXE857GXGP`
- Issuer: `https://id.shu-dcc.net`
- Flow: Authorization Code + PKCE S256
- 要求scope: `openid profile`
- 利用者識別子: `sub`
- 保存API:
  - `GET /api/me/course-profile`
  - `PUT /api/me/course-profile`
  - `DELETE /api/me/course-profile`
- Access TokenはES256署名、Issuer、UserInfo用Audience、`client_id`、UserInfoの`sub`と`dcc_member`で検証

本番確認時、旧Client ID `dcc_0yneIL16eyD4Z-VzkEO69kA6` はDCC Hub側の
`https://app.shu-dcc.net/shu-binran/` に登録されたままでした。FIS実体オリジンには、
上記の登録済みPublic Clientを使用します。
- 保存先: `/data/course-profiles.json`
- 再デプロイ後も保持するにはDCC Git公開設定で`/data`を永続ストレージとして構成する必要あり

### 起動方式

2.0.3では、DCC Gitのどちらの判定経路でも起動できるようにしてあります。

- Dockerfile経路: Node 20、内部ポート3000、Web/API/MCPを単一プロセスで起動
- Node自動判定経路: `npm ci` → `npm run build` → `npm start`
- `npm start`: `node admin-api/fisServer.js`
- Health: `/api/health`
- DockerfileとNode自動判定経路の両方をローカルコンテナで検証済み

## 4. 現在の本番状態

引継ぎ直前に確認できた状態です。

- 公開Web bundleは2.0.3
- bundle内に2024/2025/2026年度とClient IDを確認済み
- ただし`/api/health`と`/mcp`はNginxの404
- したがって現在配信されているのは静的フロントエンドで、Node API/MCPはまだ本番トラフィックを受けていない
- DCC Git UIでは公開方式として「動的サイト」を選択済みの可能性があるが、新しい動的デプロイの失敗または未反映が疑われる
- DCC Git UIの「公開状態」「公開履歴」「ビルドログ」で、配信中コミットと失敗理由を確認する必要がある

DCC Git公開画面の推奨設定:

- サイトにする方法: 動的サイト
- ブランチ: `main`
- 作業フォルダ: `/`
- 内部ポート: `3000`
- インストールコマンド: `npm ci`
- ビルドコマンド: `npm run build`
- 起動コマンド: `npm start`
- 公開フォルダ: `/dist`（動的サイトでは実質未使用でも可）
- 正常性チェック: 有効
- 確認先: `/api/health`
- 期待コード: `200`
- 起動待ち: `10`秒以上
- 永続ストレージ名の例: `fis-data`
- 永続ストレージの接続先: `/data`

設定保存後は必ず「変更を反映して再公開」または「もう一度公開」を実行してください。

## 5. 最優先で直すOIDC Redirect URI問題

現在ブラウザでは次のエラーが再現します。

```json
{
  "error": "invalid_request",
  "error_description": "redirect_uriが登録内容と一致しません"
}
```

### 確認済みの重要な事実

OIDCサーバーに対し、次のRedirect URIを明示した認可要求は302でログイン開始へ進むため、このURI自体は現在のClient IDへ登録されています。

```text
https://fis--gunn0511.shu-dcc.net/shu-binran/
```

一方、現在本番配信中の2.0.3 JavaScript bundleは、DCC静的ビルド時にViteのbaseが`/`へ上書きされたため、Redirect URIを次のように計算しています。

```js
`${window.location.origin}/`
```

つまりブラウザが現在送っている可能性が高いRedirect URIは次です。

```text
https://fis--gunn0511.shu-dcc.net/
```

これが登録済みの`/shu-binran/`付きURIと一致せず、エラーが再発しています。

### 推奨修正

`src/auth/dccOidc.js`で、Client IDだけでなく本番Redirect URIにも明示的な既定値を設定してください。

```js
const DEFAULT_REDIRECT_URI = 'https://fis--gunn0511.shu-dcc.net/shu-binran/';
```

`getDccOidcConfig()`では次の優先順位にします。

1. `VITE_DCC_REDIRECT_URI`
2. `DEFAULT_REDIRECT_URI`

`import.meta.env.BASE_URL`から本番Redirect URIを推測しないでください。ローカル開発用URIが必要なら、開発環境変数で明示してください。

Hub側の次のURIはOIDC callbackに使用しないでください。

```text
https://app.shu-dcc.net/shu-binran/
```

DCC Loginは`X-Frame-Options: SAMEORIGIN`のためiframe内に表示できません。またPKCE transactionはFIS実体オリジンの`sessionStorage`にあるため、認証開始とcallbackを同じFIS実体オリジンで完結させる必要があります。

修正後はブラウザのNetworkまたは認可URLで、実際の`redirect_uri`が登録内容と1文字単位で一致することを確認してください。末尾の`/`も一致が必要です。

## 6. 重要ファイル

- `Dockerfile`: DCC動的サイト用の単一コンテナ
- `package.json`: `build`と`start`
- `admin-api/fisServer.js`: Web/API/MCPルーティングと静的配信
- `admin-api/mcp.js`: MCP本体
- `admin-api/planningTool.js`: 残り履修計画
- `admin-api/dccAuth.js`: Access Token検証
- `admin-api/profileStore.js`: 履修情報保存
- `admin-api/test.js`: 年度・プログラム・保存テスト
- `shared/curriculum.js`: 年度フィルタ
- `shared/graduation.js`: 卒業判定
- `src/auth/dccOidc.js`: OIDC/PKCE処理
- `src/auth/DccAuthContext.jsx`: callbackとiframe bridge
- `src/components/CloudSyncPanel.jsx`: 保存UI
- `src/pages/Checker.jsx`: 年度選択とチェック画面
- `src/data/courses_info.json`: 科目データ
- `docs/mcp.md`: MCP利用方法
- `docs/dcc-login.md`: DCC Login仕様

## 7. 必須の検証手順

### ローカル

```bash
npm ci
npm run build
npm run lint
npm test --prefix admin-api
docker build -t fis-production-check .
```

Lintは既存のwarningが残っても構いませんが、errorは0にしてください。

Docker起動例:

```bash
docker run --rm -p 3000:3000 fis-production-check
```

Health:

```bash
curl http://127.0.0.1:3000/api/health
```

期待値は、バージョンが修正後の最新版で、対応年度がすべて返ることです。

### 本番MCP

`GET /mcp`が404でも異常とは限りません。MCPはPOSTで検証してください。

Initialize例:

```bash
curl -sS \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"fis-audit","version":"1.0.0"}}}' \
  https://fis--gunn0511.shu-dcc.net/mcp
```

続いて`tools/list`と全5ツールを実行してください。

必須確認:

- `list_supported_entry_years`が`[2024, 2025, 2026]`
- `search_courses(limit: 200)`の件数が143、143、147
- 2026年度限定4科目が2024/2025にはなく2026にはある
- 3年度 × DS/IE/BAで全科目入力時に総単位判定がOK
- 空の履修情報に対する`plan_remaining_courses`が必修不足と選択候補を返す
- MCP入力がサーバーへ保存されない

### DCC Loginと保存

実ブラウザで次を完走してください。

1. DCC HubのFISを開く
2. DCC Loginによるクラウド同期を選ぶ
3. iframeからFIS実体オリジンへ遷移する
4. DCC Loginを完了する
5. FISへcallbackされ、元のchecker画面へ戻る
6. 履修情報を保存する
7. 再読込して同じ情報を取得できる
8. 別端末または新しいブラウザセッションでもDCC Login後に取得できる
9. 削除操作でクラウドデータを削除できる
10. `/data`を有効にした状態で再デプロイし、保存情報が残る

Access Tokenや保存内容をMCPへ渡さないことも確認してください。

## 8. 本番の完了条件

次のすべてを満たした場合だけ完了です。

- 公開`/api/health`が200で最新版を返す
- 公開MCPがInitializeでき、5ツールが実行できる
- 2024/2025/2026年度切替と年度限定科目が正しい
- DS/IE/BAの卒業判定が動く
- Webはログインなしで使用できる
- DCC LoginのRedirect URIエラーがない
- iframeからのログインとcallbackが完走する
- 履修情報の保存・取得・削除・再デプロイ後保持が動く
- GitHubとDCC Gitの`main`が同一コミット
- DCC Gitの最新コミットが実際に公開されている
- ユーザーへ、公開MCP URLとAIクライアントへの登録方法を案内できる

## 9. Git運用上の注意

- 作業開始時に`git status`、`git log -1`、両remoteを確認する
- 既存変更があれば勝手に消さない
- 機密情報をコミットしない
- 完成した1つのコミットをGitHubとDCC Gitの両方へpushする
- push成功だけで公開成功と判断せず、公開URLを実測する
- DCC Git側の自動公開が失敗した場合は、認証済みDCC Hubからビルドログと公開履歴を確認する

## 10. DCC Git公開機能への改善提案（別プロジェクト）

FIS修正とは分けて扱ってください。今後DCC Git側を更新する場合の優先事項です。

- 「動的サイト」を「サーバーアプリ（Node.js・Docker等）」へ変更
- Dockerfile、`npm start`、UI設定のうち何が採用されたか表示
- 実効ポート、実効ビルドコマンド、実効起動コマンドを表示
- 現在配信中コミットとビルド中コミットを別表示
- ビルドログ、新コンテナログ、旧コンテナログを分離
- 公開前に`start`、ポート、Health、Dockerfileを事前検査
- 設定保存と再公開の動作を統一
- `/data`など書き込み先が永続化されていない場合に警告
- MCP Initializeと`tools/list`の接続テスト機能を追加
