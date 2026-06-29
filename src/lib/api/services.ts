import { apiFetch } from '@/lib/api/http'
import { SalonServiceResponse, CreateSalonServiceRequest } from '@/lib/types'

export function getServices(whatsappNumber: string, token: string): Promise<SalonServiceResponse[]> {
  return apiFetch<SalonServiceResponse[]>(
    `/api/services?whatsappNumber=${encodeURIComponent(whatsappNumber)}`,
    { token }
  )
}

export function getService(id: number, whatsappNumber: string, token: string): Promise<SalonServiceResponse> {
  return apiFetch<SalonServiceResponse>(
    `/api/services/${id}?whatsappNumber=${encodeURIComponent(whatsappNumber)}`,
    { token }
  )
}

export function createService(
  data: CreateSalonServiceRequest,
  token: string
): Promise<SalonServiceResponse> {
  return apiFetch<SalonServiceResponse>('/api/services', {
    method: 'POST',
    body: data,
    token,
  })
}