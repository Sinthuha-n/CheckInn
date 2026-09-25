import type { LoginResponse, Role } from '../types/api'

const toBase64Url = (value: object) =>
  btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

export const createToken = (expiresAt: number) =>
  `${toBase64Url({ alg: 'HS256', typ: 'JWT' })}.${toBase64Url({ exp: Math.floor(expiresAt / 1000) })}.signature`

export const createSession = (
  role: Role = 'USER',
  expiresAt = Date.now() + 60_000,
): LoginResponse => ({
  id: role === 'ADMIN' ? 2 : 1,
  name: role === 'ADMIN' ? 'Admin Guest' : 'Avery Guest',
  email: role === 'ADMIN' ? 'admin@example.com' : 'avery@example.com',
  role,
  token: createToken(expiresAt),
})

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
