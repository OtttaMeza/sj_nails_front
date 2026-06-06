import { apiFetch } from '@/lib/api/http'
import { ClientResponse, CreateClientRequest } from '@/lib/types'

export function getClients(token: string): Promise<ClientResponse[]> {
  return apiFetch<ClientResponse[]>('/api/clients', { token })
}

export function getClient(id: number, token: string): Promise<ClientResponse> {
  return apiFetch<ClientResponse>(`/api/clients/${id}`, { token })
}

export function createClient(data: CreateClientRequest, token: string): Promise<ClientResponse> {
  return apiFetch<ClientResponse>('/api/clients', {
    method: 'POST',
    body: data,
    token,
  })
}
