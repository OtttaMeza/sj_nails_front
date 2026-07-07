import { requireSession } from '@/lib/auth/session'
import { getAppointments } from '@/lib/api/appointments'
import { getClients } from '@/lib/api/clients'
import { getServices } from '@/lib/api/services'
import { getSalons } from '@/lib/api/salons'
import { AppointmentResponse, ClientResponse, SalonResponse, SalonServiceResponse } from '@/lib/types'
import CitasClient from './CitasClient'

export default async function CitasPage() {
  const session = await requireSession()

  let appointments: AppointmentResponse[] = []
  let clients: ClientResponse[] = []
  let services: SalonServiceResponse[] = []
  let salons: SalonResponse[] = []

  const token = session.backendToken
  const isSuperAdmin = session.role === 'SUPER_ADMIN'

  const [appsRes, clientsRes, servicesRes] = await Promise.allSettled([
    isSuperAdmin ? Promise.resolve([] as AppointmentResponse[]) : getAppointments(token),
    getClients(token),
    isSuperAdmin ? Promise.resolve([] as SalonServiceResponse[]) : getServices(token),
  ])

  if (appsRes.status === 'fulfilled') appointments = appsRes.value ?? []
  else console.error('Error fetching appointments:', appsRes.reason)

  if (clientsRes.status === 'fulfilled') clients = clientsRes.value ?? []
  else console.error('Error fetching clients:', clientsRes.reason)

  if (servicesRes.status === 'fulfilled') services = servicesRes.value ?? []
  else console.error('Error fetching services:', servicesRes.reason)

  if (isSuperAdmin) {
    try {
      salons = await getSalons(token)
    } catch (err) {
      console.error('Error fetching salons:', err)
    }
  }

  return (
    <CitasClient
      initialAppointments={appointments}
      initialClients={clients}
      initialServices={services}
      initialSalons={salons}
      role={session.role}
    />
  )
}
