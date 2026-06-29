import { requireSession } from '@/lib/auth/session'
import { getSchedules } from '@/lib/api/schedules'
import { getServices } from '@/lib/api/services'
import { Schedule, SalonServiceResponse } from '@/lib/types'
import HorariosClient from './HorariosClient'

export default async function HorariosPage() {
  const session = await requireSession()

  let schedules: Schedule[] = []
  let services: SalonServiceResponse[] = []

  try {
    const token = session.backendToken
    const whatsapp = session.username
    const [schedulesRes, servicesRes] = await Promise.all([
      getSchedules(token),
      getServices(whatsapp, token),
    ])
    schedules = schedulesRes ?? []
    services = servicesRes ?? []
  } catch (err) {
    console.error('Error fetching schedules page data:', err)
  }

  return <HorariosClient schedules={schedules} services={services} />
}
