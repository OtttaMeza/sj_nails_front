'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Scissors, 
  Sparkles 
} from 'lucide-react'

interface SidebarProps {
  username: string
}

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/citas', label: 'Citas', icon: Calendar },
  { href: '/horarios', label: 'Horarios', icon: Clock },
  { href: '/clientes', label: 'Clientes', icon: Users },
]

export default function Sidebar({ username }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (response.ok) {
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Obtener iniciales para el avatar
  const initials = username
    ? username.substring(0, 2).toUpperCase()
    : 'AD'

  return (
    <>
      {/* Botón de Hamburguesa para Móvil */}
      <header className="lg:hidden h-16 w-full bg-[#0f172a] text-white flex items-center justify-between px-6 border-b border-white/10 z-40 fixed top-0 left-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-rose-500 text-white shadow-md">
            <Scissors className="w-5 h-5" />
          </div>
          <span
            className="font-black tracking-wide text-sm"
            style={{ background: 'linear-gradient(90deg, #f472b6 0%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            SJ ESTUDIO DE UÑAS
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Overlay de menú móvil */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Componente Sidebar (Desktop y Móvil Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass-sidebar text-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen lg:flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isOpen ? 'top-0' : 'top-16 lg:top-0'}
      `}>
        {/* Encabezado del Sidebar */}
        <div className="h-20 flex items-center px-6 border-b border-white/10 gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-rose-500 to-brand-rose-400 text-white shadow-md animate-float">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span
              className="font-black tracking-wide text-sm"
              style={{ background: 'linear-gradient(90deg, #f472b6 0%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              SJ ESTUDIO
            </span>
            <span className="text-[10px] text-brand-gold-400 font-bold tracking-widest uppercase flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              <span>De UÑas</span>
            </span>
          </div>
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-brand-rose-500/25 to-brand-rose-500/10 text-white font-bold border-l-3 border-brand-rose-500 shadow-sm shadow-brand-rose-500/10' 
                    : 'hover:bg-white/8 hover:text-white text-slate-300 font-medium'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-brand-rose-500' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{label}</span>
                {isActive && (
                  <span className="absolute right-4 w-2 h-2 rounded-full bg-brand-rose-500 glow-rose animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Widget del Usuario y Botón de Logout */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-slate-950">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-rose-500 to-brand-gold-500 border border-brand-rose-400/30 flex items-center justify-center font-black text-sm text-white shadow-md">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold text-white truncate">{username}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Administrador</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-all duration-200 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-white" />
            )}
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
