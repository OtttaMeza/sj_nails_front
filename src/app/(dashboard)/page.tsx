import { requireSession } from '@/lib/auth/session'
import { getAppointments } from '@/lib/api/appointments'
import { getClients } from '@/lib/api/clients'
import { getServices } from '@/lib/api/services'
import { AppointmentResponse, ClientResponse, SalonServiceResponse } from '@/lib/types'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await requireSession()

  let appointments: AppointmentResponse[] = []
  let clients: ClientResponse[] = []
  let services: SalonServiceResponse[] = []

  try {
    const token = session.backendToken
    const [appsRes, clientsRes, servicesRes] = await Promise.all([
      getAppointments(token),
      getClients(token),
      getServices(token),
    ])
    appointments = appsRes ?? []
    clients = clientsRes ?? []
    services = servicesRes ?? []
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
  }

  return (
    <DashboardClient
      initialAppointments={appointments}
      initialClients={clients}
      initialServices={services}
    />
  )
}
