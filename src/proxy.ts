import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? 'sj_session'

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not defined')
  return new TextEncoder().encode(secret)
}

const VALID_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'USER'])

async function isValidSession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return (
      typeof payload.username === 'string' &&
      typeof payload.role === 'string' &&
      VALID_ROLES.has(payload.role) &&
      typeof payload.backendToken === 'string'
    )
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value

  const isLoginPage = pathname === '/login'
  const authenticated = token ? await isValidSession(token) : false

  if (isLoginPage) {
    if (authenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!authenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/citas/:path*', '/horarios/:path*', '/clientes/:path*', '/login'],
}
