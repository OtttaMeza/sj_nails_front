import { requireSession } from '@/lib/auth/session'
import Sidebar from '@/components/Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await requireSession()

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAFAFC]">
      {/* Sidebar responsivo y animado */}
      <Sidebar username={session.username} />

      {/* Área del Contenido Principal */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 smooth-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
