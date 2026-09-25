const normalizeUrl = (value: string) => value.replace(/\/$/, '')

export const env = Object.freeze({
  apiBaseUrl: normalizeUrl(import.meta.env.VITE_API_BASE_URL ?? '/api'),
})
