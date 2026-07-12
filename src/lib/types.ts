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
  salonId?: number
}

export interface SalonResponse {
  id: number
  name: string
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

export interface CreateSalonServiceRequest {
  salonId?: number
  name: string
  description?: string
  durationMins?: number
  price: number
}

export interface WeeklyScheduleBlock {
  id: number
  openTime: string
  closeTime: string
}

export interface WeeklyScheduleDay {
  dayOfWeek: string
  blocks: WeeklyScheduleBlock[]
}

export interface ScheduleOverrideResponse {
  id: number
  date: string
  openTime: string | null
  closeTime: string | null
  closed: boolean
  reason: string | null
}

export interface CreateScheduleOverrideRequest {
  salonId?: number
  date: string
  openTime?: string
  closeTime?: string
  closed: boolean
  reason?: string
}

export interface UpdateScheduleOverrideRequest {
  openTime?: string
  closeTime?: string
  reason?: string
}

export interface UpdateSalonServiceRequest {
  name?: string
  description?: string
  durationMins?: number
  price?: number
}

export type CreateUserRole = 'ADMIN' | 'USER'

export interface UserResponse {
  id: number
  fullName: string | null
  phone: string | null
  email: string
  role: UserRole
  active: boolean
}

export interface CreateUserRequest {
  salonId?: number
  username: string
  password: string
  role: CreateUserRole
  fullName: string
  phone: string
}

export interface UpdateUserRequest {
  fullName?: string
  phone?: string
  email?: string
  role?: CreateUserRole
}

export interface ResetPasswordRequest {
  newPassword: string
}

export interface RoleResponse {
  value: string
  label: string
}

export interface WeeklyAppointmentClient {
  id: number
  fullName: string
  phone: string
}

export interface WeeklyAppointment {
  id: number
  client: WeeklyAppointmentClient
  serviceId: number
  startTime: string
  endTime: string
  status: AppointmentStatus
  googleEventId: string | null
  notes: string | null
  createdAt: string
}

export interface WeeklyDay {
  date: string
  dayOfWeek: string
  appointments: WeeklyAppointment[]
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER'

export interface ApiResponse<T> {
  codigo: number
  mensaje: string
  data: T
}

export interface ApiError {
  status: number
  message: string
}
