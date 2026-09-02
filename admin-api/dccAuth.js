import { createRemoteJWKSet, jwtVerify } from 'jose';

const ISSUER = 'https://id.shu-dcc.net';
const DEFAULT_CLIENT_ID = 'dcc_fy43DvLjb9qCQCiXE857GXGP';
const JWKS_URI = `${ISSUER}/api/oidc/jwks`;
const USERINFO_URI = `${ISSUER}/api/oidc/userinfo`;
const remoteJwks = createRemoteJWKSet(new URL(JWKS_URI));

export async function verifyDccAccessToken(req, res, next) {
  const clientId = process.env.DCC_OIDC_CLIENT_ID?.trim() || DEFAULT_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: 'dcc_login_not_configured' });
  }

  const match = req.get('authorization')?.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'missing_bearer_token' });

  try {
    const token = match[1];
    const { payload } = await jwtVerify(token, remoteJwks, {
      issuer: ISSUER,
      audience: USERINFO_URI,
      algorithms: ['ES256'],
    });
    if (!payload.sub) throw new Error('missing sub');
    if (payload.token_use !== 'access') throw new Error('unexpected token_use');
    if (payload.client_id !== clientId) throw new Error('unexpected client_id');

    const userInfoResponse = await fetch(USERINFO_URI, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!userInfoResponse.ok) throw new Error(`userinfo ${userInfoResponse.status}`);
    const userInfo = await userInfoResponse.json();
    if (userInfo.sub !== payload.sub || userInfo.dcc_member !== true) {
      throw new Error('DCC membership could not be confirmed');
    }

    req.dccIdentity = { sub: payload.sub };
    next();
  } catch (error) {
    console.warn('DCC token verification failed:', error.message);
    res.status(401).json({ error: 'invalid_or_expired_token' });
  }
}

export async function proxyDccJwks(_req, res) {
  try {
    const response = await fetch(JWKS_URI, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return res.status(502).json({ error: 'dcc_jwks_unavailable' });
    res.set('Cache-Control', 'public, max-age=300');
    res.json(await response.json());
  } catch {
    res.status(502).json({ error: 'dcc_jwks_unavailable' });
  }
}
