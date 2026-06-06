import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface Session {
  id: string
  email: string
  role: 'ADMIN'
  salonId: number
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

    if (
      typeof payload.id !== 'string' ||
      typeof payload.email !== 'string' ||
      payload.role !== 'ADMIN' ||
      typeof payload.salonId !== 'number'
    ) {
      return null
    }

    return {
      id: payload.id,
      email: payload.email,
      role: 'ADMIN',
      salonId: payload.salonId,
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
