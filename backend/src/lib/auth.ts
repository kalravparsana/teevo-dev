import { createRemoteJWKSet, jwtVerify } from 'jose';
import { loadConfig } from './config.js';
import type { AuthUser } from './types.js';
import { unauthorized } from './errors.js';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const cfg = loadConfig();
    const url = new URL(`${cfg.jwtIssuer}/.well-known/jwks.json`);
    jwks = createRemoteJWKSet(url);
  }
  return jwks;
}

export async function verifyBearerToken(authorization?: string): Promise<AuthUser> {
  if (!authorization?.startsWith('Bearer ')) {
    throw unauthorized('Missing or invalid Authorization header');
  }
  const token = authorization.slice('Bearer '.length).trim();
  const cfg = loadConfig();
  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: cfg.jwtIssuer,
      audience: cfg.cognitoClientId,
    });
    const email = String(payload.email ?? '');
    const sub = String(payload.sub ?? '');
    if (!email || !sub) {
      throw unauthorized('Token is missing required claims');
    }
    return { sub, email };
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

export function buildLoginUrl(state: string): string {
  const cfg = loadConfig();
  const params = new URLSearchParams({
    client_id: cfg.cognitoClientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: cfg.oauthRedirectUri,
    state,
  });
  return `https://${cfg.cognitoDomain}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const cfg = loadConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: cfg.cognitoClientId,
    code,
    redirect_uri: cfg.oauthRedirectUri,
  });
  const res = await fetch(`https://${cfg.cognitoDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Token exchange failed', text);
    throw unauthorized('Sign-in could not be completed. Check Cognito configuration.');
  }
  return res.json() as Promise<{
    id_token: string;
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}
