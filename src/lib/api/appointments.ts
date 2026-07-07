import { apiFetch } from '@/lib/api/http'
import { AppointmentResponse, CreateAppointmentRequest, WeeklyDay } from '@/lib/types'

export function getAppointments(token: string): Promise<AppointmentResponse[]> {
  return apiFetch<AppointmentResponse[]>('/api/appointments', { token })
}

export function getAppointment(id: number, token: string): Promise<AppointmentResponse> {
  return apiFetch<AppointmentResponse>(`/api/appointments/${id}`, { token })
}

export function createAppointment(
  data: CreateAppointmentRequest,
  token: string
): Promise<AppointmentResponse> {
  return apiFetch<AppointmentResponse>('/api/appointments', {
    method: 'POST',
    body: data,
    token,
  })
}

export function cancelAppointment(id: number, token: string): Promise<void> {
  return apiFetch<void>(`/api/appointments/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function getWeeklyAppointments(
  token: string,
  params?: { startDate?: string; endDate?: string; salonId?: number }
): Promise<unknown> {
  const query = new URLSearchParams()
  if (params?.startDate) query.set('startDate', params.startDate)
  if (params?.endDate) query.set('endDate', params.endDate)
  if (params?.salonId) query.set('salonId', String(params.salonId))
  const qs = query.toString()
  return apiFetch<unknown>(`/api/appointments/weekly${qs ? `?${qs}` : ''}`, { token })
}
