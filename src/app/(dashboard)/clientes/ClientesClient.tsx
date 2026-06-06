'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ClientResponse } from '@/lib/types'
import { createClientAction } from './actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const createClientSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(7, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  whatsappOptin: z.boolean(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
})

type CreateClientValues = z.infer<typeof createClientSchema>

interface Props {
  initialClients: ClientResponse[]
}

export default function ClientesClient({ initialClients }: Props) {
  const [clients, setClients] = useState<ClientResponse[]>(initialClients)
  const [showModal, setShowModal] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { whatsappOptin: false },
  })

  function closeModal() {
    setShowModal(false)
    setServerError(null)
    reset()
  }

  async function onSubmit(values: CreateClientValues) {
    setServerError(null)
    const result = await createClientAction({
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      whatsappOptin: values.whatsappOptin,
      birthday: values.birthday || undefined,
      notes: values.notes || undefined,
    })

    if (!result.ok) {
      setServerError(result.error ?? 'Error al crear cliente')
      return
    }

    if (result.client) {
      startTransition(() => {
        setClients((prev) => [result.client!, ...prev])
      })
    }
    closeModal()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1 text-sm">{clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          + Nuevo cliente
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        {clients.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">No hay clientes registrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">WhatsApp</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Cumpleaños</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{client.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{client.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{client.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${client.whatsappOptin ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {client.whatsappOptin ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {client.birthday
                      ? format(new Date(client.birthday), 'd MMM', { locale: es })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {format(new Date(client.createdAt), 'd MMM yyyy', { locale: es })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Nuevo cliente</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Nombre completo *</label>
                <input
                  {...register('fullName')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="María García"
                />
                {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Teléfono *</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="3001234567"
                />
                {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="maria@example.com"
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Cumpleaños</label>
                <input
                  {...register('birthday')}
                  type="date"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Notas</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  placeholder="Preferencias, alergias..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  {...register('whatsappOptin')}
                  id="whatsappOptin"
                  type="checkbox"
                  className="rounded border-slate-300"
                />
                <label htmlFor="whatsappOptin" className="text-sm text-slate-700">
                  Acepta notificaciones por WhatsApp
                </label>
              </div>

              {serverError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{serverError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
