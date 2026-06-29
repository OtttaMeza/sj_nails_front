import { requireSession } from '@/lib/auth/session'
import { getAppointments } from '@/lib/api/appointments'
import { getClients } from '@/lib/api/clients'
import { getServices } from '@/lib/api/services'
import { AppointmentResponse, ClientResponse, SalonServiceResponse } from '@/lib/types'
import CitasClient from './CitasClient'

export default async function CitasPage() {
  const session = await requireSession()

  let appointments: AppointmentResponse[] = []
  let clients: ClientResponse[] = []
  let services: SalonServiceResponse[] = []

  try {
    const token = session.backendToken
    const whatsapp = session.username
    const [appsRes, clientsRes, servicesRes] = await Promise.all([
      getAppointments(token),
      getClients(token),
      getServices(whatsapp, token),
    ])
    appointments = appsRes ?? []
    clients = clientsRes ?? []
    services = servicesRes ?? []
  } catch (err) {
    console.error('Error fetching appointments page data:', err)
  }

  return (
    <CitasClient
      initialAppointments={appointments}
      initialClients={clients}
      initialServices={services}
    />
  )
}
