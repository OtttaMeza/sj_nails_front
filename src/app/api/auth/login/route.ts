import { signSession, COOKIE_NAME, MAX_AGE } from '@/lib/auth/session'
import { NextRequest, NextResponse } from 'next/server'

interface LoginBody {
  email: string
  password: string
}

interface BackendAuthResponse {
  token: string
  id: string
  email: string
  role: string
  salonId: number
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: LoginBody

  try {
    body = (await request.json()) as LoginBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Email y contraseña son requeridos' }, { status: 400 })
  }

  try {
    if (process.env.MOCK_AUTH === 'true') {
      if (email !== 'admin@sjnails.com' || password !== 'admin123') {
        return NextResponse.json({ ok: false, error: 'Credenciales inválidas' }, { status: 401 })
      }

      const token = await signSession({ id: '1', email, role: 'ADMIN', salonId: 1 })

      const response = NextResponse.json({
        ok: true,
        user: { id: '1', email, role: 'ADMIN' },
      })

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: MAX_AGE,
        path: '/',
      })

      return response
    }

    const backendUrl = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:8080'
    const backendResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      const errorMessage =
        (errorData as { message?: string; error?: string })?.message ??
        (errorData as { message?: string; error?: string })?.error ??
        'Credenciales inválidas'
      return NextResponse.json({ ok: false, error: errorMessage }, { status: backendResponse.status })
    }

    const data = (await backendResponse.json()) as BackendAuthResponse
    const token = await signSession({
      id: data.id,
      email: data.email,
      role: 'ADMIN',
      salonId: data.salonId,
    })

    const response = NextResponse.json({
      ok: true,
      user: { id: data.id, email: data.email, role: data.role },
    })

    response.cookies.set(COOKIE_NAME, token, {
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
