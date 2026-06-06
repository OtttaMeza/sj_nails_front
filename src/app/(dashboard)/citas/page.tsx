import { requireSession } from '@/lib/auth/session'

export default async function CitasPage() {
  await requireSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Citas</h1>
        <p className="text-slate-500 mt-1">Gestion de citas del salon</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-500 text-sm">
          Proximamente: listado de citas, cambio de estado y cancelacion.
        </p>
      </div>
    </div>
  )
}
