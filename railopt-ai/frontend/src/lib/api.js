/**
 * RailOpt AI - Centralized ML & Optimization Backend API Client
 * Provides consistent base URL, timeout handling, error normalization, and health status.
 */

export const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

/**
 * Standard fetch wrapper with timeout and normalized error reporting
 */
export async function apiFetch(endpoint, options = {}, timeoutMs = 45000) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `Server responded with ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch (_) {
        // Fall back to HTTP status message
      }
      const error = new Error(errorMsg);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${endpoint} timed out after ${timeoutMs / 1000}s`);
    }
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to ML Optimization Service at ${API_BASE}. Ensure backend is running.`);
    }
    throw err;
  }
}

/**
 * Check backend service health
 */
export async function checkBackendHealth() {
  try {
    return await apiFetch('/health', { method: 'GET' }, 5000);
  } catch (err) {
    return { status: 'unreachable', error: err.message };
  }
}
