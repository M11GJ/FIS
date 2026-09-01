# DCC Login連携

FISの個人データ機能は、DCC LoginをOpenID ProviderとしてAuthorization Code + PKCEで認証します。
FIS独自のパスワードは保持しません。

## DCC Login側のクライアント登録

- 種別: Public Client
- Token endpoint auth method: none
- PKCE: S256必須
- Grant: authorization_code
- Scope: openid profile dcc.student
- 本番Redirect URI: https://m11gj.github.io/FIS/
- ローカルRedirect URI: http://localhost:5173/FIS/

登録後、払い出されたClient IDをデプロイ環境のVITE_DCC_CLIENT_IDに設定します。Redirect URIを変更する場合は、DCC Loginの登録値とVITE_DCC_REDIRECT_URIを完全一致させてください。

GitHub Pagesでは、リポジトリのActions variablesに次を登録します。

- DCC_LOGIN_CLIENT_ID: DCC Loginから払い出されたClient ID
- DCC_LOGIN_REDIRECT_URI: https://m11gj.github.io/FIS/

## DCC Login側で必要なCORS設定

ブラウザで安全にOIDCを完結するため、次のGET応答にも許可Originに応じたAccess-Control-Allow-Originが必要です。

- /.well-known/openid-configuration
- /api/oidc/jwks

本番のToken、UserInfo、Revocation endpointはGitHub Pages Originを許可済みですが、2026年9月1日の確認時点でDiscoveryとJWKSにはCORS応答ヘッダーがありません。FISはID Tokenの署名検証を省略せず、DCC Login側の設定不足時はログインを失敗させます。許可対象は少なくとも https://m11gj.github.io と http://localhost:5173 です。

## セキュリティ上の方針

- 利用者の主キーは変更されないsubを使用する。
- 学籍番号、氏名、Discord名を主キーにしない。
- state、nonce、PKCE verifierはsessionStorageへ一時保存する。
- ID TokenはDiscoveryのJWKSを用いてES256署名、Issuer、Audience、期限、Nonceを検証する。
- Access TokenはsessionStorageだけに保存し、ブラウザ終了後は残さない。
- Web版ではoffline_accessを要求せず、Refresh Tokenを保持しない。
- ログアウト時はローカルセッションを削除し、Revocation endpointへAccess Tokenの失効を依頼する。
- 個人データ用APIは将来も学籍番号をリクエスト引数に取らず、検証済みsubから本人を特定する。

## 公開範囲

学生便覧と公開科目情報は未ログインでも閲覧できます。単位チェックなど個人データを扱う画面だけDCC Loginを必須にします。
