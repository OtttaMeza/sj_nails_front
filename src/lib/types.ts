export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface AppointmentResponse {
  id: number
  clientId: number
  serviceId: number
  startTime: string
  endTime: string
  status: AppointmentStatus
  googleEventId: string | null
  notes: string | null
  createdAt: string
}

export interface CreateAppointmentRequest {
  whatsappNumber: string
  clientId: number
  serviceId: number
  startTime: string
  endTime: string
  notes?: string
}

export interface ClientResponse {
  id: number
  fullName: string
  phone: string
  email: string | null
  whatsappOptin: boolean
  birthday: string | null
  createdAt: string
}

export interface CreateClientRequest {
  fullName: string
  phone: string
  email?: string
  whatsappOptin: boolean
  birthday?: string
  notes?: string
}

export interface Schedule {
  id: number
  tenantId: number
  dayOfWeek: string
  openTime: string
  closeTime: string
}

export interface SalonServiceResponse {
  id: number
  name: string
  description: string | null
  durationMins: number
  price: number
  active: boolean
}

export interface ApiError {
  status: number
  message: string
}
