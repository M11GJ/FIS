const ISSUER = 'https://id.shu-dcc.net';
const DISCOVERY_URL = `${ISSUER}/.well-known/openid-configuration`;

const TRANSACTION_KEY = 'fis.dcc.oidc.transaction.v1';
const SESSION_KEY = 'fis.dcc.oidc.session.v1';
const textEncoder = new TextEncoder();

function encodeBase64Url(bytes) {
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

function createRandomValue(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

async function createCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(verifier));
  return encodeBase64Url(new Uint8Array(digest));
}

function getClientId() {
  return import.meta.env.VITE_DCC_CLIENT_ID?.trim() || '';
}

export function getDccOidcConfig() {
  const configuredRedirect = import.meta.env.VITE_DCC_REDIRECT_URI?.trim();
  const defaultRedirect = `${window.location.origin}${import.meta.env.BASE_URL}`;
  return {
    issuer: ISSUER,
    discoveryUrl: DISCOVERY_URL,
    clientId: getClientId(),
    redirectUri: configuredRedirect || defaultRedirect,
    scopes: import.meta.env.VITE_DCC_SCOPES?.trim() || 'openid profile',
  };
}

export function isDccOidcConfigured() {
  return Boolean(getClientId());
}

async function fetchDiscovery() {
  return {
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/api/oidc/authorize`,
    token_endpoint: `${ISSUER}/api/oidc/token`,
    revocation_endpoint: `${ISSUER}/api/oidc/revoke`,
    userinfo_endpoint: `${ISSUER}/api/oidc/userinfo`,
    jwks_uri: `${import.meta.env.BASE_URL}api/auth/dcc/jwks`,
    code_challenge_methods_supported: ['S256'],
  };
}

async function verifyIdToken(idToken, discovery, transaction, clientId) {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('ID Tokenの形式が不正です');

  const header = decodeJsonPart(parts[0]);
  const payload = decodeJsonPart(parts[1]);
  if (header.alg !== 'ES256' || !header.kid) {
    throw new Error('ID Tokenの署名方式が不正です');
  }

  const jwksResponse = await fetch(discovery.jwks_uri, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!jwksResponse.ok) throw new Error('DCC Loginの公開鍵取得に失敗しました');

  const jwks = await jwksResponse.json();
  const jwk = jwks.keys?.find(key => key.kid === header.kid && key.kty === 'EC');
  if (!jwk) throw new Error('ID Tokenに対応する公開鍵が見つかりません');

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );
  const verified = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    decodeBase64Url(parts[2]),
    textEncoder.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!verified) throw new Error('ID Tokenの署名を検証できませんでした');

  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (payload.iss !== ISSUER) throw new Error('ID TokenのIssuerが一致しません');
  if (!audiences.includes(clientId)) throw new Error('ID TokenのAudienceが一致しません');
  if (audiences.length > 1 && payload.azp !== clientId) {
    throw new Error('ID TokenのAuthorized Partyが一致しません');
  }
  if (!payload.exp || payload.exp <= now - 60) throw new Error('ID Tokenの有効期限が切れています');
  if (payload.iat && payload.iat > now + 60) throw new Error('ID Tokenの発行日時が不正です');
  if (payload.nonce !== transaction.nonce) throw new Error('ID TokenのNonceが一致しません');
  if (!payload.sub) throw new Error('ID Tokenにsubがありません');
  return payload;
}

async function fetchUserInfo(discovery, accessToken) {
  const response = await fetch(discovery.userinfo_endpoint, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`DCC Loginのユーザー情報取得に失敗しました (${response.status})`);
  }
  return response.json();
}

export async function beginDccLogin(returnTo = window.location.hash || '#/') {
  const config = getDccOidcConfig();
  if (!config.clientId) throw new Error('VITE_DCC_CLIENT_IDが設定されていません');

  const discovery = await fetchDiscovery();
  const verifier = createRandomValue(64);
  const transaction = {
    state: createRandomValue(),
    nonce: createRandomValue(),
    verifier,
    returnTo: returnTo.startsWith('#/') ? returnTo : '#/',
    createdAt: Date.now(),
  };
  sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify(transaction));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes,
    state: transaction.state,
    nonce: transaction.nonce,
    code_challenge: await createCodeChallenge(verifier),
    code_challenge_method: 'S256',
  });
  window.location.assign(`${discovery.authorization_endpoint}?${params.toString()}`);
}

export function hasOidcCallbackParameters() {
  const params = new URLSearchParams(window.location.search);
  return params.has('code') || params.has('error');
}

export async function completeDccLogin() {
  const config = getDccOidcConfig();
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  if (error) {
    throw new Error(params.get('error_description') || `DCC Loginで認証できませんでした (${error})`);
  }

  const code = params.get('code');
  const returnedState = params.get('state');
  const rawTransaction = sessionStorage.getItem(TRANSACTION_KEY);
  if (!code || !returnedState || !rawTransaction) {
    throw new Error('OIDC認証情報が不足しています。ログインをやり直してください');
  }

  const transaction = JSON.parse(rawTransaction);
  sessionStorage.removeItem(TRANSACTION_KEY);
  if (Date.now() - transaction.createdAt > 10 * 60 * 1000) {
    throw new Error('OIDC認可リクエストの有効期限が切れています');
  }
  if (returnedState !== transaction.state) throw new Error('OIDC Stateが一致しません');

  const discovery = await fetchDiscovery();
  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: transaction.verifier,
    }),
  });
  if (!tokenResponse.ok) {
    throw new Error(`DCC Loginのトークン交換に失敗しました (${tokenResponse.status})`);
  }

  const tokens = await tokenResponse.json();
  if (!tokens.access_token || !tokens.id_token) {
    throw new Error('DCC Loginから必要なトークンが返されませんでした');
  }

  const idClaims = await verifyIdToken(tokens.id_token, discovery, transaction, config.clientId);
  const userInfo = await fetchUserInfo(discovery, tokens.access_token);
  if (userInfo.sub !== idClaims.sub) throw new Error('UserInfoとID Tokenの利用者が一致しません');
  if (userInfo.dcc_member !== true && idClaims.dcc_member !== true) {
    throw new Error('DCC部員であることを確認できませんでした');
  }

  const expiresIn = Number(tokens.expires_in) || 600;
  const session = {
    accessToken: tokens.access_token,
    tokenType: tokens.token_type || 'Bearer',
    expiresAt: Date.now() + expiresIn * 1000,
    user: { ...idClaims, ...userInfo, sub: idClaims.sub },
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

  const callbackUrl = new URL(config.redirectUri);
  window.history.replaceState(
    {},
    document.title,
    `${callbackUrl.pathname}${callbackUrl.search}${transaction.returnTo}`,
  );
  return session;
}

export function loadDccSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session.accessToken || !session.user?.sub || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function revalidateDccSession(session) {
  const discovery = await fetchDiscovery();
  const userInfo = await fetchUserInfo(discovery, session.accessToken);
  if (userInfo.sub !== session.user.sub || userInfo.dcc_member !== true) {
    throw new Error('DCC Loginのセッションを再確認できませんでした');
  }
  const updated = { ...session, user: { ...session.user, ...userInfo, sub: session.user.sub } };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  return updated;
}

export async function revokeDccSession(session) {
  sessionStorage.removeItem(SESSION_KEY);
  if (!session?.accessToken) return;
  try {
    const config = getDccOidcConfig();
    const discovery = await fetchDiscovery();
    await fetch(discovery.revocation_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: session.accessToken,
        token_type_hint: 'access_token',
        client_id: config.clientId,
      }),
    });
  } catch {
    // ローカルセッションは削除済み。IdP側の失効失敗でログアウトを妨げない。
  }
}
