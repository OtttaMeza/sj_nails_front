'use server'

import { createAppointment, cancelAppointment } from '@/lib/api/appointments'
import { getAvailableSlots } from '@/lib/api/schedules'
import { getSession } from '@/lib/auth/session'
import { AppointmentResponse, CreateAppointmentRequest } from '@/lib/types'
import { revalidatePath } from 'next/cache'

interface CreateActionResult {
  ok: boolean
  appointment?: AppointmentResponse
  error?: string
}

interface CancelActionResult {
  ok: boolean
  error?: string
}

interface AvailableSlotsResult {
  ok: boolean
  slots?: string[]
  error?: string
}

export async function createAppointmentAction(
  data: CreateAppointmentRequest
): Promise<CreateActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  try {
    const appointment = await createAppointment(data, session.backendToken)
    revalidatePath('/citas')
    revalidatePath('/')
    return { ok: true, appointment }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear la cita'
    return { ok: false, error: message }
  }
}

export async function cancelAppointmentAction(id: number): Promise<CancelActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  try {
    await cancelAppointment(id, session.backendToken)
    revalidatePath('/citas')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cancelar la cita'
    return { ok: false, error: message }
  }
}

export async function getAvailableSlotsAction(
  serviceId: number,
  date: string
): Promise<AvailableSlotsResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  try {
    const slots = await getAvailableSlots(serviceId, date, session.backendToken)
    return { ok: true, slots }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener horarios disponibles'
    return { ok: false, error: message }
  }
}
