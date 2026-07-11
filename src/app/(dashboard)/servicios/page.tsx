import { requireSession } from '@/lib/auth/session'
import { getServices } from '@/lib/api/services'
import { getSalons } from '@/lib/api/salons'
import { SalonResponse, SalonServiceResponse } from '@/lib/types'
import ServiciosClient from './ServiciosClient'

export default async function ServiciosPage() {
  const session = await requireSession()

  let services: SalonServiceResponse[] = []
  let salons: SalonResponse[] = []

  const token = session.backendToken
  const isSuperAdmin = session.role === 'SUPER_ADMIN'

  if (session.role === 'ADMIN') {
    try {
      services = await getServices(token, session.salonId)
    } catch (err) {
      console.error('Error fetching services:', err)
    }
  } else if (isSuperAdmin) {
    try {
      salons = await getSalons(token)
    } catch (err) {
      console.error('Error fetching salons:', err)
    }
  }

  return (
    <ServiciosClient
      initialServices={services}
      initialSalons={salons}
      role={session.role}
    />
  )
}