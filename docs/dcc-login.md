# DCC Login連携方針

FISの通常機能と公開MCPは、アカウントなしで利用できる設計とします。単位チェックの履修情報はブラウザ内にだけ保存し、通常利用ではDCC Loginへ接続せず、利用者のDCCアカウントとも結び付けません。

DCC Loginを使うのは、利用者がクラウド保存・端末間同期などを明示的に選択し、ログイン情報と履修情報を組み合わせる場合だけです。ログイン完了だけを理由に履修情報を送信してはいけません。

## 現在の動作

- 学生便覧・科目情報・単位チェックは未ログインで利用できる。
- 選択した履修情報は `localStorage` に匿名で自動保存する。
- 利用者は画面から端末内データをリセットできる。
- 共有URLの作成は利用者が明示的に操作した場合だけ行う。
- DCC Loginは利用者が「任意のクラウド保存」を選んだときだけ開始する。
- 認証後も自動送信せず、「保存する」と最終確認を押した場合だけ年度・プログラム・科目IDを保存する。
- 読み込み、上書き保存、クラウドデータ削除、ログアウトを利用者自身で実行できる。
- MCPは匿名・読み取り専用であり、DCCアカウントや保存済み履修情報へアクセスしない。

## クラウド連携の同意境界

1. 利用者が「クラウド保存・同期」を選択する。
2. 送信する情報と保存目的を画面に表示する。
3. DCC Loginで本人確認する。
4. 認証後も自動送信せず、最終確認を求める。
5. 同意後にだけ、検証済み `sub` と履修情報を個人データAPIへ送る。
6. 連携解除・保存データ削除を利用者自身で実行できるようにする。

利用者の主キーには変更されない `sub` を使用し、学籍番号・氏名・Discord名を主キーにしません。個人データAPIは学籍番号を本人指定の引数として受け取らず、検証済みトークンの `sub` から本人を特定します。

## OIDCクライアント登録

- 種別: Public Client
- Token endpoint auth method: none
- PKCE: S256必須
- Grant: authorization_code
- Scope: openid profile
- Redirect URI: `https://fis--gunn0511.shu-dcc.net/shu-binran/`
- ローカルRedirect URI: http://localhost:5173/shu-binran/

払い出されたClient IDを `VITE_DCC_CLIENT_ID` に、登録したRedirect URIを `VITE_DCC_REDIRECT_URI` に設定します。Client Secretは静的フロントエンドへ置きません。Web版では `offline_access` を要求せず、Refresh Tokenも保持しません。

DCC Hubの `/shu-binran/` はFIS本体をiframeで表示する入口です。OIDCのstate・PKCE verifierをFIS本体と同じオリジンで復元できるよう、Redirect URIにはHub URLではなく上記のFIS本体URLを登録します。

## OIDCのブラウザ互換対応

Discoveryの公開値は固定Issuerと本番エンドポイントを使用し、JWKSはFISバックエンドの同一オリジンプロキシを経由します。ブラウザでもID TokenのES256署名検証は省略しません。保存API側でもAccess TokenのIssuer・Audience・署名を検証し、UserInfoで現在のDCC所属を再確認します。

## リポジトリとホスティング

GitHubとDCC Gitは、常に同じコミットを保持する正本として扱います。公開ホスティングはDCC Git側で行い、GitHub側のワークフローはビルド検証だけを実行します。
