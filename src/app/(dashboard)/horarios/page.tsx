import { requireSession } from '@/lib/auth/session'
import { getWeeklySchedule, getScheduleOverrides } from '@/lib/api/schedules'
import { getServices } from '@/lib/api/services'
import { getSalons } from '@/lib/api/salons'
import { WeeklyScheduleDay, SalonServiceResponse, SalonResponse, ScheduleOverrideResponse } from '@/lib/types'
import HorariosClient from './HorariosClient'

export default async function HorariosPage() {
  const session = await requireSession()

  let weekly: WeeklyScheduleDay[] = []
  let services: SalonServiceResponse[] = []
  let salons: SalonResponse[] = []
  let overrides: ScheduleOverrideResponse[] = []

  const token = session.backendToken
  const isSuperAdmin = session.role === 'SUPER_ADMIN'

  const fetches: Promise<void>[] = []

  if (!isSuperAdmin) {
    fetches.push(
      getWeeklySchedule(token)
        .then(r => { weekly = r ?? [] })
        .catch(e => console.error('Error fetching weekly schedule:', e))
    )
    fetches.push(
      getServices(token, session.salonId)
        .then(r => { services = r ?? [] })
        .catch(e => console.error('Error fetching services:', e))
    )
    fetches.push(
      getScheduleOverrides(token)
        .then(r => { overrides = r ?? [] })
        .catch(e => console.error('Error fetching schedule overrides:', e))
    )
  } else {
    fetches.push(
      getSalons(token)
        .then(r => { salons = r ?? [] })
        .catch(e => console.error('Error fetching salons:', e))
    )
  }

  await Promise.all(fetches)

  return (
    <HorariosClient
      initialWeekly={weekly}
      initialSalons={salons}
      initialServices={services}
      initialOverrides={overrides}
      role={session.role}
    />
  )
}
