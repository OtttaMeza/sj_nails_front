import { apiFetch } from '@/lib/api/http'
import { Schedule } from '@/lib/types'

export function getSchedules(token: string): Promise<Schedule[]> {
  return apiFetch<Schedule[]>('/api/schedules', { token })
}

export function getAvailableSlots(
  serviceId: number,
  date: string,
  token: string
): Promise<string[]> {
  return apiFetch<string[]>(
    `/api/schedules/available-slots?serviceId=${serviceId}&date=${encodeURIComponent(date)}`,
    { token }
  )
}
