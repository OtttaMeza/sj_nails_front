import { requireSession } from '@/lib/auth/session'
import { getUsers } from '@/lib/api/users'
import { getSalons } from '@/lib/api/salons'
import { UserResponse, SalonResponse } from '@/lib/types'
import UsuariosClient from './UsuariosClient'

export default async function UsuariosPage() {
  const session = await requireSession()

  let users: UserResponse[] = []
  let salons: SalonResponse[] = []

  const token = session.backendToken
  const isSuperAdmin = session.role === 'SUPER_ADMIN'

  const fetches: Promise<void>[] = []

  if (!isSuperAdmin) {
    fetches.push(
      getUsers(token)
        .then(r => { users = r ?? [] })
        .catch(e => console.error('Error fetching users:', e))
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
    <UsuariosClient
      initialUsers={users}
      initialSalons={salons}
      role={session.role}
    />
  )
}
