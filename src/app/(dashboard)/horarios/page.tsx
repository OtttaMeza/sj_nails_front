import { requireSession } from '@/lib/auth/session'
import { getSchedules } from '@/lib/api/schedules'
import { getServices } from '@/lib/api/services'
import { Schedule, SalonServiceResponse } from '@/lib/types'
import HorariosClient from './HorariosClient'

export default async function HorariosPage() {
  const session = await requireSession()

  let schedules: Schedule[] = []
  let services: SalonServiceResponse[] = []

  const token = session.backendToken

  const [schedulesRes, servicesRes] = await Promise.allSettled([
    getSchedules(token),
    getServices(token),
  ])

  if (schedulesRes.status === 'fulfilled') schedules = schedulesRes.value ?? []
  else console.error('Error fetching schedules:', schedulesRes.reason)

  if (servicesRes.status === 'fulfilled') services = servicesRes.value ?? []
  else console.error('Error fetching services:', servicesRes.reason)

  return <HorariosClient schedules={schedules} services={services} />
}
