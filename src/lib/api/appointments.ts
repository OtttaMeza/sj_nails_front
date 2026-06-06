import { apiFetch } from '@/lib/api/http'
import { AppointmentResponse, CreateAppointmentRequest } from '@/lib/types'

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
  return apiFetch<void>(`/api/appointments/${id}/cancel`, {
    method: 'PATCH',
    token,
  })
}
