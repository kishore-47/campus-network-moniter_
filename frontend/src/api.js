// Helper for building API URLs with a fallback when VITE_API_URL is missing
// This ensures the frontend works both in local development and when deployed
// behind the same origin as the backend (e.g. /api).  If the environment
// variable is not defined the code will default to the current origin.

const rawBase = import.meta.env.VITE_API_URL || '';

// strip any trailing slash to avoid double-slashes
const trimmed = rawBase.replace(/\/$/, '');

export const API_BASE_URL = trimmed ? `${trimmed}/api` : '/api';

/**
 * Return a complete URL to the API for the given path.
 *
 * @param {string} path  Path portion, e.g. '/summary' or 'alerts'
 */
export function api(path) {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return `${API_BASE_URL}${path}`;
}

// If the variable is missing we log a warning during startup so developers
// notice the configuration issue early.
if (!rawBase) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_URL is not set; defaulting to same-origin /api');
}
