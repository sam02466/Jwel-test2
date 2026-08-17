// Thin fetch wrapper around the backend's JSON API. Every route returns
// { success: true, data } or { success: false, message } / { success:
// false, errors: [...] } — see ../../../backend/lib/api-response.ts.
// `credentials: 'include'` is what carries the httpOnly admin/agent/
// customer session cookie; in dev that only works because
// vite.config.js proxies /api to the backend as same-origin, and in
// production because both are deployed under one domain (see
// backend/README.md).

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors || null
  }
}

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options
  })

  let json = null
  try {
    json = await res.json()
  } catch {
    // no body (e.g. some 204s) — fall through, res.ok still checked below
  }

  if (!res.ok || !json || json.success === false) {
    const message = json?.message || (json?.errors && json.errors[0]?.message) || `Request failed (${res.status})`
    throw new ApiError(message, res.status, json?.errors)
  }
  return json.data
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData })
}
