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

  const token = session.backendToken

  const [appsRes, clientsRes, servicesRes] = await Promise.allSettled([
    getAppointments(token),
    getClients(token),
    getServices(token),
  ])

  if (appsRes.status === 'fulfilled') appointments = appsRes.value ?? []
  else console.error('Error fetching appointments:', appsRes.reason)

  if (clientsRes.status === 'fulfilled') clients = clientsRes.value ?? []
  else console.error('Error fetching clients:', clientsRes.reason)

  if (servicesRes.status === 'fulfilled') services = servicesRes.value ?? []
  else console.error('Error fetching services:', servicesRes.reason)

  return (
    <CitasClient
      initialAppointments={appointments}
      initialClients={clients}
      initialServices={services}
    />
  )
}
