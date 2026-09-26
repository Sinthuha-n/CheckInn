import { env } from '../config/env'
import { authStorage, isTokenExpired } from '../features/auth/authStorage'
import type { ApiErrorShape } from '../types/api'

const defaultMessages: Record<number, string> = {
  400: 'The request could not be completed. Please review your details.',
  401: 'Your session is no longer valid. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested information could not be found.',
  409: 'This request conflicts with existing information.',
}

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number
  readonly fieldErrors?: Record<string, string>

  constructor({ status, message, fieldErrors }: ApiErrorShape) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  token?: string
}

const request = async (
  path: string,
  { body, headers, token, ...options }: ApiRequestOptions = {},
) => {
  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  let response: Response

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...options,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: requestHeaders,
    })
  } catch {
    throw new ApiError({
      status: 0,
      message:
        'We could not reach CheckInn. Check your connection and try again.',
    })
  }

  if (!response.ok) {
    expireInvalidSession(response.status, token)
    throw await readError(response)
  }

  return response
}

const isStringRecord = (value: unknown): value is Record<string, string> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((entry) => typeof entry === 'string')

const readError = async (response: Response): Promise<ApiError> => {
  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    payload = undefined
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return new ApiError({ status: response.status, message: payload.message })
  }

  if (isStringRecord(payload) && Object.keys(payload).length > 0) {
    return new ApiError({
      status: response.status,
      message: 'Please check the highlighted fields and try again.',
      fieldErrors: payload,
    })
  }

  return new ApiError({
    status: response.status,
    message:
      defaultMessages[response.status] ??
      'Something went wrong while contacting CheckInn. Please try again.',
  })
}

const expireInvalidSession = (status: number, token: string | undefined) => {
  if (!token) {
    return
  }

  if (status === 401 || (status === 403 && isTokenExpired(token))) {
    authStorage.expire()
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await request(path, options)

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function apiDownload(
  path: string,
  options: ApiRequestOptions = {},
) {
  const response = await request(path, options)
  return response.blob()
}
