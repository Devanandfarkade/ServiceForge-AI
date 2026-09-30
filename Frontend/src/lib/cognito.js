/**
 * ServiceForge AI — Amazon Cognito Authentication Client
 *
 * Pure HTTP implementation calling the Cognito Identity Provider public API.
 * No SDK required. Works with Vite environment variables.
 *
 * Cognito endpoints used:
 *   POST https://cognito-idp.<region>.amazonaws.com/
 *   X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth
 *   X-Amz-Target: AWSCognitoIdentityProviderService.GlobalSignOut
 *   X-Amz-Target: AWSCognitoIdentityProviderService.GetUser
 *
 * Token storage: sessionStorage (tab-scoped, not persisted to disk unlike localStorage)
 */

const REGION = import.meta.env.VITE_AWS_REGION || 'ap-south-1';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const COGNITO_ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

const TOKEN_KEYS = {
  ID_TOKEN: 'sf_id_token',
  ACCESS_TOKEN: 'sf_access_token',
  REFRESH_TOKEN: 'sf_refresh_token',
  EXPIRES_AT: 'sf_expires_at',
};

// ─── Low-level Cognito HTTP helper ──────────────────────────────────────────

async function cognitoRequest(target, body) {
  const response = await fetch(COGNITO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorCode = data.__type || data.code || 'UnknownError';
    const message = data.message || 'Authentication error occurred.';
    throw Object.assign(new Error(message), { code: errorCode, status: response.status });
  }

  return data;
}

// ─── Token persistence ───────────────────────────────────────────────────────

function storeTokens({ IdToken, AccessToken, RefreshToken, ExpiresIn }) {
  const expiresAt = Date.now() + (ExpiresIn || 3600) * 1000;
  sessionStorage.setItem(TOKEN_KEYS.ID_TOKEN, IdToken);
  sessionStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, AccessToken);
  if (RefreshToken) {
    sessionStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, RefreshToken);
  }
  sessionStorage.setItem(TOKEN_KEYS.EXPIRES_AT, String(expiresAt));
}

function clearTokens() {
  Object.values(TOKEN_KEYS).forEach(k => sessionStorage.removeItem(k));
}

function getStoredToken(key) {
  return sessionStorage.getItem(key) || null;
}

// ─── Token helpers ───────────────────────────────────────────────────────────

function isTokenExpired() {
  const expiresAt = Number(sessionStorage.getItem(TOKEN_KEYS.EXPIRES_AT) || 0);
  // Consider expired 60s before actual expiry
  return Date.now() > expiresAt - 60_000;
}

function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// ─── Public auth API ─────────────────────────────────────────────────────────

/**
 * Sign in with email + password using USER_PASSWORD_AUTH flow.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ idToken: string, accessToken: string, user: object }>}
 */
export async function signIn(email, password) {
  const data = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const result = data.AuthenticationResult;
  if (!result) {
    // Handle NEW_PASSWORD_REQUIRED or other challenges
    throw Object.assign(new Error('Authentication challenge required.'), {
      code: 'ChallengeName',
      challengeName: data.ChallengeName,
    });
  }

  storeTokens(result);

  const payload = parseJwtPayload(result.IdToken);
  const user = {
    userId: payload?.sub || '',
    email: payload?.email || email,
    fullName: payload?.name || payload?.email || email,
    role: payload?.['custom:role'] || 'SERVICE_MANAGER',
    organizationId: payload?.['custom:org_id'] || '',
  };

  return { idToken: result.IdToken, accessToken: result.AccessToken, user };
}

/**
 * Refresh tokens using stored refresh token.
 * @returns {Promise<string>} The new access token (also stored).
 */
export async function refreshSession() {
  const refreshToken = getStoredToken(TOKEN_KEYS.REFRESH_TOKEN);
  if (!refreshToken) throw new Error('No refresh token available.');

  const data = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  const result = data.AuthenticationResult;
  storeTokens({ ...result, RefreshToken: refreshToken });
  return result.AccessToken;
}

/**
 * Sign out globally (revokes all tokens on Cognito side).
 */
export async function signOut() {
  const accessToken = getStoredToken(TOKEN_KEYS.ACCESS_TOKEN);
  clearTokens();
  if (accessToken) {
    try {
      await cognitoRequest('GlobalSignOut', { AccessToken: accessToken });
    } catch {
      // Ignore: tokens already cleared locally
    }
  }
}

/**
 * Returns the current valid access token, refreshing if needed.
 * Returns null if not authenticated.
 * @returns {Promise<string|null>}
 */
export async function getValidAccessToken() {
  const accessToken = getStoredToken(TOKEN_KEYS.ACCESS_TOKEN);
  if (!accessToken) return null;

  if (!isTokenExpired()) return accessToken;

  try {
    return await refreshSession();
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Returns the current valid ID token, refreshing if needed.
 * Returns null if not authenticated.
 * @returns {Promise<string|null>}
 */
export async function getValidIdToken() {
  const idToken = getStoredToken(TOKEN_KEYS.ID_TOKEN);
  if (!idToken) return null;

  if (!isTokenExpired()) return idToken;

  try {
    await refreshSession();
    return getStoredToken(TOKEN_KEYS.ID_TOKEN);
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Returns the stored ID token without refreshing.
 * Prefer getValidAccessToken() for API calls.
 */
export function getIdToken() {
  return getStoredToken(TOKEN_KEYS.ID_TOKEN);
}

/**
 * Returns whether the user is currently authenticated.
 */
export function isAuthenticated() {
  return !!getStoredToken(TOKEN_KEYS.ACCESS_TOKEN);
}

/**
 * Returns parsed user info from the stored ID token.
 * @returns {object|null}
 */
export function getCurrentUserFromToken() {
  const idToken = getStoredToken(TOKEN_KEYS.ID_TOKEN);
  if (!idToken) return null;

  const payload = parseJwtPayload(idToken);
  if (!payload) return null;

  return {
    userId: payload.sub || '',
    email: payload.email || '',
    fullName: payload.name || payload.email || '',
    role: payload['custom:role'] || 'SERVICE_MANAGER',
    organizationId: payload['custom:org_id'] || '',
  };
}
