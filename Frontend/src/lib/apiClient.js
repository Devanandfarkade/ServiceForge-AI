/**
 * ServiceForge AI — Centralized API Client
 *
 * All API Gateway requests go through this module.
 * - Automatically attaches Cognito Authorization header
 * - Handles token refresh transparently
 * - Normalizes success/error response envelopes from the backend
 * - Maps HTTP errors to user-safe messages
 *
 * Usage:
 *   import { apiClient } from '../lib/apiClient';
 *   const data = await apiClient.get('/service-requests');
 *   const result = await apiClient.post('/service-requests', { description: '...' });
 */

import { getValidIdToken, signOut } from './cognito';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// ─── User-safe error messages ────────────────────────────────────────────────

const ERROR_MESSAGES = {
  INVALID_TOKEN: 'Your session has expired. Please sign in again.',
  ACCESS_DENIED: 'You do not have permission to perform this action.',
  RESOURCE_NOT_FOUND: 'The requested resource could not be found.',
  INVALID_INPUT: 'The request contains invalid data. Please review and try again.',
  INVALID_STATE_TRANSITION: 'This action cannot be performed in the current status.',
  THROTTLED: 'Too many requests. Please wait a moment and try again.',
  INTERNAL_ERROR: 'A server error occurred. Please try again later.',
};

function getUserSafeMessage(errorCode, fallbackMessage) {
  return ERROR_MESSAGES[errorCode] || fallbackMessage || 'An unexpected error occurred.';
}

// ─── Core request function ───────────────────────────────────────────────────

/**
 * @param {string} method - HTTP method
 * @param {string} path - API path (e.g., '/service-requests')
 * @param {object|null} body - Request body for POST/PATCH
 * @param {object} options - Additional options
 * @returns {Promise<any>} - Resolved data from response envelope
 */
async function request(method, path, body = null, options = {}) {
  // Get valid (refreshed-if-needed) ID token
  const idToken = await getValidIdToken();

  if (!idToken) {
    // Redirect to login; handle gracefully
    window.dispatchEvent(new CustomEvent('sf:auth:expired'));
    throw Object.assign(new Error('Authentication required.'), {
      code: 'INVALID_TOKEN',
      status: 401,
    });
  }

  const url = `${BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
    ...options.headers,
  };

  const config = {
    method,
    headers,
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw Object.assign(new Error('Network error. Check your connection and try again.'), {
      code: 'NETWORK_ERROR',
      status: 0,
    });
  }

  // Parse JSON body
  let json;
  try {
    json = await response.json();
  } catch {
    // Non-JSON response
    if (!response.ok) {
      throw Object.assign(new Error(`Server error: ${response.status}`), {
        code: 'INTERNAL_ERROR',
        status: response.status,
      });
    }
    return null;
  }

  // Handle 401 — attempt to sign out and notify
  if (response.status === 401) {
    signOut().catch(() => {});
    window.dispatchEvent(new CustomEvent('sf:auth:expired'));
    throw Object.assign(new Error(getUserSafeMessage('INVALID_TOKEN')), {
      code: 'INVALID_TOKEN',
      status: 401,
    });
  }

  // Handle structured error envelope { success: false, error: { code, message } }
  if (!response.ok) {
    const errorCode = json?.error?.code || 'INTERNAL_ERROR';
    const rawMessage = json?.error?.message || `Request failed with status ${response.status}`;
    const safeMessage = getUserSafeMessage(errorCode, rawMessage);

    throw Object.assign(new Error(safeMessage), {
      code: errorCode,
      status: response.status,
      details: json?.error?.details || [],
      raw: json,
    });
  }

  // Unwrap success envelope: return data field if present, otherwise full json
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data;
  }

  return json;
}

// ─── Public API client ───────────────────────────────────────────────────────

export const apiClient = {
  get: (path, options = {}) => request('GET', path, null, options),
  post: (path, body, options = {}) => request('POST', path, body, options),
  patch: (path, body, options = {}) => request('PATCH', path, body, options),
  delete: (path, options = {}) => request('DELETE', path, null, options),

  /**
   * Upload a file directly to S3 using a presigned URL.
   * No Authorization header is sent — this goes directly to S3.
   * @param {string} presignedUrl
   * @param {File} file
   * @param {string} contentType
   */
  uploadToS3: async (presignedUrl, file, contentType) => {
    const headers = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers,
      body: file,
    });

    if (!response.ok) {
      throw Object.assign(new Error('File upload to S3 failed. Please try again.'), {
        code: 'S3_UPLOAD_ERROR',
        status: response.status,
      });
    }

    return true;
  },
};
