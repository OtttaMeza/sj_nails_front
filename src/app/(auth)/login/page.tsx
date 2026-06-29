'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Eye, EyeOff, CalendarDays, MessageCircle, BarChart3, Star, ArrowRight, User } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const data = (await response.json()) as { ok: boolean; error?: string }

    if (!data.ok) {
      setServerError(data.error ?? 'Error al iniciar sesión')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="h-screen flex overflow-hidden">
      {/* Panel izquierdo — 35% */}
      <div
        className="hidden lg:flex flex-col p-12 relative overflow-hidden lg:w-[38%] h-full flex-shrink-0"
        style={{ backgroundColor: '#0F1021' }}
      >
        {/* Decorative corner element */}
        <div className="absolute top-0 left-0 w-32 h-32 opacity-15 pointer-events-none select-none">
          <svg className="w-full h-full text-[#FF6FB3]" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10 0 C 10 30, 40 40, 40 80 C 20 80, 0 50, 0 0 Z" />
          </svg>
        </div>

        {/* Branding header */}
        <div className="relative z-10 shrink-0">
          <Image
            src="/Logo_web.png"
            alt="MiCita Platform"
            width={180}
            height={56}
            className="object-contain object-left"
            priority
          />
        </div>

        {/* Ambient glows inside dark panel */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#684EFF]/25 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 -right-10 w-72 h-72 rounded-full bg-[#FF6FB3]/15 blur-[100px] pointer-events-none" />
        
        {/* Floating particles */}
        <div className="absolute top-[22%] right-[12%] w-1.5 h-1.5 rounded-full bg-[#FF6FB3]/60 pointer-events-none animate-pulse" />
        <div className="absolute top-[48%] left-[6%] w-1 h-1 rounded-full bg-white/30 pointer-events-none" />
        <div className="absolute top-[68%] right-[18%] w-1 h-1 rounded-full bg-[#684EFF]/50 pointer-events-none animate-pulse" />

        {/* Wave divider — solo visible en xl+ para evitar solapamiento en pantallas estrechas */}
        <div className="absolute top-0 -right-px h-full w-44 pointer-events-none z-0 hidden xl:block">
          <svg className="h-full w-full text-[#FAFAFC]" viewBox="0 0 100 1000" preserveAspectRatio="none" fill="currentColor">
            <path d="M100 0 C 30 200, 20 450, 80 620 C 105 760, 40 900, 100 1000 Z" />
          </svg>
          <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 1000" preserveAspectRatio="none" fill="none">
            <path d="M98 0 C 28 200, 18 450, 78 620 C 103 760, 38 900, 98 1000" stroke="#FF6FB3" strokeWidth="0.75" opacity="0.35" />
            <path d="M96 0 C 26 200, 16 450, 76 620 C 101 760, 36 900, 96 1000" stroke="#684EFF" strokeWidth="0.75" opacity="0.25" />
          </svg>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-9 relative z-10 pr-6 xl:pr-48 mt-12">
          <div className="space-y-4">
            <h1>
              <span className="text-white text-5xl font-extrabold block tracking-tight">Tu negocio.</span>
              <span
                className="block text-5xl font-bold italic mt-2"
                style={{
                  background: 'linear-gradient(135deg, #FF6FB3 0%, #684EFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Más inteligente.
              </span>
            </h1>
            <p className="text-[#94A3B8] mt-4 text-[13.5px] leading-relaxed max-w-sm">
              La plataforma que automatiza reservas, clientes, empleados, pagos y comunicación desde un solo lugar.
            </p>
          </div>

          <div className="space-y-6 pt-2">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1D2033] border border-white/5 text-[#B39EFF]">
                <CalendarDays className="w-5 h-5 text-[#684EFF]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-white text-sm font-bold">Agenda inteligente</p>
                <p className="text-[#667085] text-xs leading-normal">Organiza citas automáticamente y reduce ausencias.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1D2033] border border-white/5 text-emerald-400">
                <MessageCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="space-y-0.5">
                <p className="text-white text-sm font-bold">WhatsApp integrado</p>
                <p className="text-[#667085] text-xs leading-normal">Confirma citas y responde clientes mediante IA.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1D2033] border border-white/5 text-[#FF6FB3]">
                <BarChart3 className="w-5 h-5 text-[#FF6FB3]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-white text-sm font-bold">Analítica en tiempo real</p>
                <p className="text-[#667085] text-xs leading-normal">Conoce el rendimiento de tu negocio al instante.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center gap-3 text-[#94A3B8] text-xs">
              <Star className="w-4 h-4 text-[#F2C94C]" />
              <span>
                Más de 15 herramientas.{' '}
                <span className="text-white font-medium">Una sola plataforma.</span>
              </span>
            </div>
          </div>
        </div>

        <p className="text-[#667085]/40 text-[11px] mt-auto relative z-10">
          © 2025 MiCita Platform. Todos los derechos reservados.
        </p>
      </div>

      {/* Panel derecho — 65% con ambient glows radiales y tarjeta flotante */}
      <div 
        className="w-full lg:w-[62%] h-full flex flex-col items-center justify-center p-6 lg:p-16 relative overflow-y-auto"
        style={{ 
          background: 'radial-gradient(at 85% 15%, rgba(104, 78, 255, 0.04) 0px, transparent 40%), radial-gradient(at 15% 85%, rgba(255, 111, 179, 0.04) 0px, transparent 40%), #FAFAFC' 
        }}
      >
        <div className="w-full max-w-[430px] bg-white rounded-[32px] border border-[#E5E7F2] p-8 md:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.02)] space-y-8 z-10">
          <div className="text-center">
            <h2
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-4xl font-extrabold italic text-[#1D2033]"
            >
              Bienvenido nuevamente
            </h2>
            <p className="text-[#667085] text-xs mt-2.5 font-medium">Accede a tu espacio de trabajo.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-[#1D2033] mb-2"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-[#667085] stroke-[1.5]" />
                </div>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  {...register('username')}
                  className="w-full brand-input rounded-xl bg-white pl-11 pr-4 py-3 text-sm text-[#1D2033] font-medium placeholder:text-[#94A3B8]/80 placeholder:font-normal disabled:opacity-50"
                  placeholder="ej. admin@micitaapp.com"
                  disabled={isSubmitting}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-600 font-medium mt-1.5">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#1D2033] mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#667085] stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full brand-input rounded-xl bg-white pl-11 pr-11 py-3 text-sm text-[#1D2033] font-medium placeholder:text-[#94A3B8]/80 placeholder:font-normal disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#667085] hover:text-[#1D2033] transition-colors duration-150"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 font-medium mt-1.5">{errors.password.message}</p>
              )}
              
              <div className="flex justify-end mt-2">
                <a href="#" className="text-xs text-[#684EFF] font-semibold hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded cursor-pointer accent-[#684EFF]"
              />
              <label htmlFor="remember" className="text-xs text-[#667085] cursor-pointer select-none font-medium">
                Recordarme
              </label>
            </div>

            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                <p className="text-xs text-red-600 font-medium">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl py-3 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(104,78,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-[180ms] hover:shadow-[0_12px_28px_rgba(104,78,255,0.35)] hover:-translate-y-px active:translate-y-0 mt-2"
              style={{ background: 'linear-gradient(135deg, #684EFF 0%, #9B6DFF 100%)' }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Autenticando...
                </>
              ) : (
                <>
                  Ingresar a MiCita
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-[#E5E7F2]" />
              <span className="text-[10px] text-[#667085] font-bold uppercase tracking-wider">o continúa con</span>
              <div className="flex-1 h-px bg-[#E5E7F2]" />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E5E7F2] bg-white text-[#1D2033] text-xs font-semibold hover:bg-[#F8F7FC] transition-all duration-200 hover:border-[#684EFF]/30"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Google</span>
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E5E7F2] bg-white text-[#1D2033] text-xs font-semibold hover:bg-[#F8F7FC] transition-all duration-200 hover:border-[#684EFF]/30"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path fill="#F25022" d="M1 1h10v10H1z" />
                  <path fill="#00A4EF" d="M13 1h10v10H13z" />
                  <path fill="#7FBA00" d="M1 13h10v10H1z" />
                  <path fill="#FFB900" d="M13 13h10v10H13z" />
                </svg>
                <span>Microsoft</span>
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-[#667085]">
            ¿No tienes cuenta?{' '}
            <a href="#" className="text-[#684EFF] font-bold hover:underline">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}