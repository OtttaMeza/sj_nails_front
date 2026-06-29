import { apiFetch } from '@/lib/api/http'
import { SalonServiceResponse, CreateSalonServiceRequest } from '@/lib/types'

export function getServices(token: string): Promise<SalonServiceResponse[]> {
  return apiFetch<SalonServiceResponse[]>('/api/services', { token })
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