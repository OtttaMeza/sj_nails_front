import { apiFetch } from '@/lib/api/http'
import { UserResponse, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest, RoleResponse } from '@/lib/types'

export function getRoles(token: string): Promise<RoleResponse[]> {
  return apiFetch<RoleResponse[]>('/api/users/roles', { token })
}

export function getUsers(token: string, salonId?: number): Promise<UserResponse[]> {
  const query = salonId ? `?salonId=${salonId}` : ''
  return apiFetch<UserResponse[]>(`/api/users${query}`, { token })
}

export function createUser(data: CreateUserRequest, token: string): Promise<UserResponse> {
  return apiFetch<UserResponse>('/api/auth/register', {
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

export function resetUserPassword(
  id: number,
  data: ResetPasswordRequest,
  token: string,
  salonId?: number,
): Promise<void> {
  const query = salonId ? `?salonId=${salonId}` : ''
  return apiFetch<void>(`/api/users/${id}/password${query}`, {
    method: 'PATCH',
    body: data,
    token,
  })
}

export function deactivateUser(id: number, token: string, salonId?: number): Promise<void> {
  const params = new URLSearchParams({ active: 'false' })
  if (salonId) params.set('salonId', String(salonId))
  return apiFetch<void>(`/api/users/${id}/status?${params}`, {
    method: 'PATCH',
    token,
  })
}
