import { apiFetch } from '@/lib/api/http'
import { Schedule, WeeklyScheduleDay, CreateScheduleOverrideRequest, ScheduleOverrideResponse } from '@/lib/types'

export function getSchedules(token: string): Promise<Schedule[]> {
  return apiFetch<Schedule[]>('/api/schedules', { token })
}

export function getWeeklySchedule(token: string, salonId?: number): Promise<WeeklyScheduleDay[]> {
  const query = salonId ? `?salonId=${salonId}` : ''
  return apiFetch<WeeklyScheduleDay[]>(`/api/schedules/weekly${query}`, { token })
}

export function getScheduleOverrides(token: string, salonId?: number): Promise<ScheduleOverrideResponse[]> {
  const query = salonId ? `?salonId=${salonId}` : ''
  return apiFetch<ScheduleOverrideResponse[]>(`/api/schedules/overrides${query}`, { token })
}

export function deleteScheduleOverride(id: number, token: string): Promise<void> {
  return apiFetch<void>(`/api/schedules/overrides/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function createScheduleOverride(
  data: CreateScheduleOverrideRequest,
  token: string,
): Promise<void> {
  return apiFetch<void>('/api/schedules/overrides', {
    method: 'POST',
    body: data,
    token,
  })
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
