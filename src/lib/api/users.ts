import { apiFetch } from '@/lib/api/http'
import { UserResponse, CreateUserRequest, UpdateUserRequest } from '@/lib/types'

export function getUsers(token: string, salonId?: number): Promise<UserResponse[]> {
  const query = salonId ? `?salonId=${salonId}` : ''
  return apiFetch<UserResponse[]>(`/api/users${query}`, { token })
}

export function createUser(data: CreateUserRequest, token: string): Promise<UserResponse> {
  return apiFetch<UserResponse>('/api/users', {
    method: 'POST',
    body: data,
    token,
  })
}

export function updateUser(
  id: number,
  data: UpdateUserRequest,
  token: string,
  salonId?: number,
): Promise<UserResponse> {
  const query = salonId ? `?salonId=${salonId}` : ''
  return apiFetch<UserResponse>(`/api/users/${id}${query}`, {
    method: 'PUT',
    body: data,
    token,
  })
}

export function deactivateUser(id: number, token: string, salonId?: number): Promise<void> {
  const query = salonId ? `?salonId=${salonId}` : ''
  return apiFetch<void>(`/api/users/${id}${query}`, {
    method: 'DELETE',
    token,
  })
}
