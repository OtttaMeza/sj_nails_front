import { getClients } from '@/lib/api/clients'
import { getSession } from '@/lib/auth/session'
import { ClientResponse } from '@/lib/types'
import { redirect } from 'next/navigation'
import ClientesClient from './ClientesClient'

export default async function ClientesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  let clients: ClientResponse[] = []
  try {
    clients = await getClients(session.backendToken)
  } catch {
    clients = []
  }

  return <ClientesClient initialClients={clients} />
}