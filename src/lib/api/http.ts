import { ApiError, ApiResponse } from '@/lib/types'

const BASE_URL = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:9090'

interface FetchOptions extends Omit<RequestInit, 'body'> {
  token?: string
  body?: unknown
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, body, headers: customHeaders, ...rest } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const errorBody = (await response.json()) as ApiResponse<null> | { mensaje?: string }
      message = (errorBody as ApiResponse<null>)?.mensaje ?? message
    } catch {
      // mantiene statusText si el body no es JSON
    }

    const error: ApiError = { status: response.status, message }
    throw error
  }

  return response.json() as Promise<T>
}
