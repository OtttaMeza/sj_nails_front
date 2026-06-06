import { signSession, COOKIE_NAME, MAX_AGE } from '@/lib/auth/session'
import { NextRequest, NextResponse } from 'next/server'

interface LoginBody {
  username: string
  password: string
}

interface BackendAuthData {
  token: string
  username: string
  role: string
}

interface BackendApiResponse {
  codigo: number
  mensaje: string
  data: BackendAuthData
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: LoginBody

  try {
    body = (await request.json()) as LoginBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  const { username, password } = body

  if (!username || !password) {
    return NextResponse.json({ ok: false, error: 'Usuario y contraseña son requeridos' }, { status: 400 })
  }

  try {
    if (process.env.MOCK_AUTH === 'true') {
      if (username !== 'superadmin' || password !== 'Admin@2024!') {
        return NextResponse.json({ ok: false, error: 'Credenciales inválidas' }, { status: 401 })
      }

      const mockJwt = 'mock-token'
      const sessionToken = await signSession({ id: '1', username, role: 'SUPER_ADMIN', salonId: 1, backendToken: mockJwt })

      const response = NextResponse.json({
        ok: true,
        user: { username, role: 'SUPER_ADMIN' },
      })

      response.cookies.set(COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: MAX_AGE,
        path: '/',
      })

      return response
    }

    const backendUrl = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:9090'
    const backendResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!backendResponse.ok) {
      const errorData = (await backendResponse.json().catch(() => ({}))) as { mensaje?: string }
      return NextResponse.json(
        { ok: false, error: errorData?.mensaje ?? 'Credenciales inválidas' },
        { status: backendResponse.status },
      )
    }

    const { data } = (await backendResponse.json()) as BackendApiResponse
    const sessionToken = await signSession({
      id: data.username,
      username: data.username,
      role: data.role as 'SUPER_ADMIN' | 'ADMIN' | 'USER',
      salonId: 1,
      backendToken: data.token,
    })

    const response = NextResponse.json({
      ok: true,
      user: { username: data.username, role: data.role },
    })

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ ok: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
