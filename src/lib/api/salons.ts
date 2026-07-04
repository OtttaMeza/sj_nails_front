import { apiFetch } from '@/lib/api/http'
import { SalonResponse } from '@/lib/types'

export function getSalons(token: string): Promise<SalonResponse[]> {
  return apiFetch<SalonResponse[]>('/api/admin/salons', { token })
}