import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface Session {
  id: string
  username: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER'
  salonId: number
  backendToken: string
}

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? 'sj_session'
const MAX_AGE = parseInt(process.env.SESSION_MAX_AGE ?? '3600', 10)

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not defined')
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: Session): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecretKey())
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getSecretKey())

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'USER']
    if (
      typeof payload.id !== 'string' ||
      typeof payload.username !== 'string' ||
      typeof payload.role !== 'string' ||
      !validRoles.includes(payload.role) ||
      typeof payload.backendToken !== 'string'
    ) {
      return null
    }

    return {
      id: payload.id,
      username: payload.username,
      role: payload.role as Session['role'],
      salonId: typeof payload.salonId === 'number' ? payload.salonId : 1,
      backendToken: payload.backendToken,
    }
  } catch {
    return null
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export { COOKIE_NAME, MAX_AGE }
