'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { User, Lock, ArrowRight, Sparkles, Gem } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

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
    <main className="min-h-screen flex bg-slate-100">
      {/* Panel izquierdo: Visual/Branding (oculto en móviles) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden dark-gradient items-center justify-center p-12">
        {/* Círculos de gradiente decorativos en el fondo - Más vivos */}
        <div className="absolute top-[-15%] left-[-15%] w-[80%] h-[80%] rounded-full bg-brand-rose-500/25 blur-[100px] animate-pulse-subtle" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[80%] h-[80%] rounded-full bg-brand-gold-500/20 blur-[100px] animate-pulse-subtle" />
        
        {/* Contenido de Branding */}
        <div className="relative z-10 text-center max-w-lg space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md animate-float shadow-xl">
            <Gem className="w-14 h-14 text-brand-gold-400" />
          </div>
          <div className="space-y-4">
            <h1
              className="text-5xl sm:text-6xl drop-shadow-xl leading-tight py-3 font-light tracking-widest"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 40%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SJ Estudio de Uñas
            </h1>
            <p className="text-lg text-slate-100 font-semibold leading-relaxed drop-shadow">
              Plataforma de gestión inteligente para salones de belleza, estética y cuidado personal.
            </p>
          </div>
          <div className="pt-4 flex justify-center gap-4 text-xs text-white">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 shadow-sm font-bold">
              <Sparkles className="w-4 h-4 text-brand-rose-400" />
              <span>Estilo Premium</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 shadow-sm font-bold">
              <span>Gestión Ágil</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho: Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-slate-50">
        <div className="absolute top-10 left-10 lg:hidden flex items-center gap-2">
          <Gem className="w-6 h-6 text-brand-rose-600" />
          <span className="font-light tracking-widest text-brand-rose-700 italic" style={{ fontFamily: 'var(--font-display)' }}>SJ Estudio de Uñas</span>
        </div>

        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
          <div className="space-y-2">
            <h2
              className="text-4xl font-light text-slate-950 tracking-wide"
              style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
            >
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-600 text-sm font-medium">
              Ingresa tus credenciales para acceder al panel de administración.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            <div className="space-y-5">
              {/* Input Usuario */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Usuario
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-rose-600 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    {...register('username')}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-rose-500/30 focus:border-brand-rose-600 focus:bg-white shadow-sm smooth-transition disabled:opacity-50"
                    placeholder="ej. superadmin"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-red-600 font-bold mt-1 pl-1">{errors.username.message}</p>
                )}
              </div>

              {/* Input Contraseña */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-rose-600 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-rose-500/30 focus:border-brand-rose-600 focus:bg-white shadow-sm smooth-transition disabled:opacity-50"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 font-bold mt-1 pl-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Alertas de error del servidor */}
            {serverError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 animate-pulse-subtle">
                <p className="text-sm text-rose-700 font-bold">{serverError}</p>
              </div>
            )}

            {/* Botón de Enviar - Gradiente Vivo */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative overflow-hidden group rounded-xl bg-gradient-to-r from-brand-rose-600 to-brand-rose-500 py-3.5 text-sm font-bold text-white shadow-md hover:from-brand-rose-700 hover:to-brand-rose-600 hover:shadow-lg hover:shadow-brand-rose-500/20 focus:outline-none focus:ring-2 focus:ring-brand-rose-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}