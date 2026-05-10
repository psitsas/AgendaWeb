/**
 * Cliente HTTP compartido — añade JWT automáticamente y maneja errores globales.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.agendi.app';

export async function apiRequest(path, options = {}) {
  const token    = localStorage.getItem('agendi_token');
  const tenantId = localStorage.getItem('agendi_tenant_id');

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token    ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'X-Tenant-Slug': localStorage.getItem('agendi_tenant_slug') || '' } : {}),
      ...options.headers,
    },
  });

  // Token expirado → forzar logout
  if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/';
    return;
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || err.title || `HTTP ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export const api = {
  get:   (path)       => apiRequest(path, { method: 'GET' }),
  post:  (path, body) => apiRequest(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:   (path, body) => apiRequest(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch: (path, body) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del:   (path)       => apiRequest(path, { method: 'DELETE' }),
};
