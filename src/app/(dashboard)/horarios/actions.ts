'use server'

import { getWeeklySchedule, createScheduleOverride, getScheduleOverrides, deleteScheduleOverride } from '@/lib/api/schedules'
import { getSession } from '@/lib/auth/session'
import { WeeklyScheduleDay, CreateScheduleOverrideRequest, ScheduleOverrideResponse } from '@/lib/types'

interface WeeklyScheduleResult {
  ok: boolean
  weekly?: WeeklyScheduleDay[]
  error?: string
}

function extractError(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return fallback
}

interface CreateOverrideResult {
  ok: boolean
  error?: string
}

export async function createScheduleOverrideAction(
  data: CreateScheduleOverrideRequest,
): Promise<CreateOverrideResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role === 'USER') return { ok: false, error: 'Sin permisos' }
  if (session.role === 'SUPER_ADMIN' && !data.salonId) {
    return { ok: false, error: 'Debes seleccionar un negocio' }
  }
  if (!data.closed && (!data.openTime || !data.closeTime)) {
    return { ok: false, error: 'Debes indicar la hora de apertura y cierre' }
  }

  try {
    await createScheduleOverride(data, session.backendToken)
    return { ok: true }
  } catch (err) {
    console.error('[createScheduleOverrideAction]', err)
    return { ok: false, error: extractError(err, 'Error al crear el horario especial') }
  }
}

export async function getWeeklyScheduleAction(salonId?: number): Promise<WeeklyScheduleResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  const resolvedSalonId = session.role === 'SUPER_ADMIN' ? salonId : undefined

  try {
    const weekly = await getWeeklySchedule(session.backendToken, resolvedSalonId)
    return { ok: true, weekly }
  } catch (err) {
    console.error('[getWeeklyScheduleAction]', err)
    return { ok: false, error: extractError(err, 'Error al obtener horarios semanales') }
  }
}

interface OverridesResult {
  ok: boolean
  overrides?: ScheduleOverrideResponse[]
  error?: string
}

export async function getScheduleOverridesAction(salonId?: number): Promise<OverridesResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  const resolvedSalonId = session.role === 'SUPER_ADMIN' ? salonId : undefined

  try {
    const overrides = await getScheduleOverrides(session.backendToken, resolvedSalonId)
    return { ok: true, overrides }
  } catch (err) {
    console.error('[getScheduleOverridesAction]', err)
    return { ok: false, error: extractError(err, 'Error al obtener horarios especiales') }
  }
}

interface DeleteOverrideResult {
  ok: boolean
  error?: string
}

export async function deleteScheduleOverrideAction(id: number): Promise<DeleteOverrideResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role === 'USER') return { ok: false, error: 'Sin permisos' }

  try {
    await deleteScheduleOverride(id, session.backendToken)
    return { ok: true }
  } catch (err) {
    console.error('[deleteScheduleOverrideAction]', err)
    return { ok: false, error: extractError(err, 'Error al eliminar el horario especial') }
  }
}
