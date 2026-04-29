// src/api.js
// Central fetch wrapper — sets base URL and always sends cookies

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',   // send httpOnly cookie on every request
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  // For 204 No Content, return null instead of trying to parse JSON
  if (res.status === 204) return null

  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data?.message || 'Request failed')
    err.status = res.status
    throw err
  }

  return data
}

export const api = {
  get:    (path)         => request(path),
  post:   (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (path, body)   => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)         => request(path, { method: 'DELETE' }),
}
