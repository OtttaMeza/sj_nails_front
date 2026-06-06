import { apiFetch } from '@/lib/api/http'
import { SalonServiceResponse } from '@/lib/types'

export function getServices(token: string): Promise<SalonServiceResponse[]> {
  return apiFetch<SalonServiceResponse[]>('/api/services', { token })
}

export function getService(id: number, token: string): Promise<SalonServiceResponse> {
  return apiFetch<SalonServiceResponse>(`/api/services/${id}`, { token })
}
