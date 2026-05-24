/**
 * Authentication: Basic Auth sign-in, JWT storage, payload decode.
 */
import { CONFIG } from '../config.js';

/**
 * POST /signin with Authorization: Basic base64(identifier:password)
 * @param {string} identifier
 * @param {string} password
 * @returns {Promise<string>} JWT
 */
export async function signIn(identifier, password) {
  const credentials = `${identifier}:${password}`;
  const header = btoa(unescape(encodeURIComponent(credentials)));

  const res = await fetch(CONFIG.AUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${header}`,
      Accept: 'application/json',
    },
  });

  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const msg =
      (body && (body.message || body.error)) ||
      `Sign-in failed (${res.status})`;
    throw new Error(msg);
  }

  let token =
    typeof body === 'string'
      ? body
      : body &&
        (body.token ||
          body.access_token ||
          body.jwt ||
          body.data ||
          body.accessToken);

  if (!token && text) {
    const t = text.trim().replace(/^"|"$/g, '');
    if (/^[\w-]+\.[\w-]+\.[\w-]+$/.test(t)) token = t;
  }

  if (!token || typeof token !== 'string') {
    throw new Error('Sign-in succeeded but no JWT was returned.');
  }
  return token;
}

export function getToken() {
  try {
    return localStorage.getItem(CONFIG.STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(jwt) {
  localStorage.setItem(CONFIG.STORAGE_KEY, jwt);
}

export function clearToken() {
  localStorage.removeItem(CONFIG.STORAGE_KEY);
}

/** @param {string} jwt */
export function decodeJwtPayload(jwt) {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** @param {string} jwt @returns {number|string|null} */
export function getUserIdFromJwt(jwt) {
  const payload = decodeJwtPayload(jwt);
  if (!payload) return null;
  const hasura =
    payload['https://hasura.io/jwt/claims'] ||
    payload['claims.jwt.hasura.io'] ||
    {};
  const id =
    hasura['x-hasura-user-id'] ||
    hasura['X-Hasura-User-Id'] ||
    payload.sub ||
    payload.userId ||
    payload.user_id ||
    payload.id;
  if (id === undefined || id === null) return null;
  const n = Number(id);
  return Number.isFinite(n) && String(n) === String(id) ? n : String(id);
}
