import { requireSession } from '@/lib/auth/session'

export default async function DashboardPage() {
  await requireSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Resumen del día</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-500 text-sm">
          Proximamente: citas del dia, contadores y proximos turnos.
        </p>
      </div>
    </div>
  )
}
