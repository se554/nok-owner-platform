'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SyncButton({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleSync() {
    setState('loading')
    setMsg('')
    try {
      const res = await fetch(`/api/sync/guesty?propertyId=${propertyId}`, { method: 'POST' })
      const data = await res.json()
      const errors = data.synced?.errors?.length ? ` | Errores: ${data.synced.errors.join(', ')}` : ''
      setMsg((data.message ?? data.error ?? 'Sincronizado') + errors)
      setState('done')
      // Refresh server data without full reload
      setTimeout(() => { router.refresh(); setState('idle') }, 1500)
    } catch {
      setMsg('Error al sincronizar')
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && (
        <span className={`text-xs ${state === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
          {msg}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={state === 'loading' || state === 'done'}
        className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-gray-600 flex items-center gap-2 disabled:opacity-50"
      >
        <span className={state === 'loading' ? 'animate-spin inline-block' : ''}>↻</span>
        {state === 'loading' ? 'Sincronizando...' : 'Sincronizar con Guesty'}
      </button>
    </div>
  )
}
