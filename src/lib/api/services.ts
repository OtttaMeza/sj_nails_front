import { apiFetch } from '@/lib/api/http'
import { SalonServiceResponse, CreateSalonServiceRequest, UpdateSalonServiceRequest } from '@/lib/types'

export function getServices(token: string, salonId?: number): Promise<SalonServiceResponse[]> {
  const query = salonId ? `?salonId=${salonId}` : ''
  return apiFetch<SalonServiceResponse[]>(`/api/services${query}`, { token })
}

export function getService(id: number, token: string): Promise<SalonServiceResponse> {
  return apiFetch<SalonServiceResponse>(`/api/services/${id}`, { token })
}

export function createService(data: CreateSalonServiceRequest, token: string): Promise<SalonServiceResponse> {
  return apiFetch<SalonServiceResponse>('/api/services', {
    method: 'POST',
    body: data,
    token,
  })
}

export function updateService(
  id: number,
  data: UpdateSalonServiceRequest,
  token: string,
  salonId?: number,
): Promise<SalonServiceResponse> {
  const query = salonId ? `?salonId=${salonId}` : ''
  return apiFetch<SalonServiceResponse>(`/api/services/${id}${query}`, {
    method: 'PUT',
    body: data,
    token,
  })
}

export function deleteService(id: number, token: string, salonId?: number): Promise<SalonServiceResponse> {
  const query = salonId ? `?salonId=${salonId}` : ''
  return apiFetch<SalonServiceResponse>(`/api/services/${id}${query}`, {
    method: 'DELETE',
    token,
  })
}