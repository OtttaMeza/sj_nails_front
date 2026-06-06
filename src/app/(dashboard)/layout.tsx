import { requireSession, COOKIE_NAME } from '@/lib/auth/session'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

async function LogoutButton() {
  async function handleLogout() {
    'use server'
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
    redirect('/login')
  }

  return (
    <form action={handleLogout}>
      <button
        type="submit"
        className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        Cerrar sesión
      </button>
    </form>
  )
}

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/citas', label: 'Citas' },
  { href: '/horarios', label: 'Horarios' },
  { href: '/clientes', label: 'Clientes' },
]

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await requireSession()

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <span className="text-lg font-semibold text-slate-900">SJ Nails Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-3 py-4 space-y-1">
          <p className="px-3 py-1 text-xs text-slate-400 truncate">{session.email}</p>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
