'use server'

import { createClient } from '@/lib/api/clients'
import { getSession } from '@/lib/auth/session'
import { ClientResponse, CreateClientRequest } from '@/lib/types'

interface ActionResult {
  ok: boolean
  client?: ClientResponse
  error?: string
}

export async function createClientAction(data: CreateClientRequest): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  try {
    const client = await createClient(data, session.backendToken)
    return { ok: true, client }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear cliente'
    return { ok: false, error: message }
  }
}
