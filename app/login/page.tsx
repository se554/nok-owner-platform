'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos. Intenta de nuevo.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/brand/nok-logo.svg" alt="NOK" width={100} height={32} priority />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EFEFEF] p-8">
          <h1 className="text-xl font-bold text-[#1D1D1B] mb-1">Acceso al portal</h1>
          <p className="text-sm text-[#8A8A8A] mb-6">Exclusivo para propietarios NOK</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1D1D1B] mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@correo.com"
                className="w-full px-4 py-2.5 border border-[#C8C8C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0080C6] focus:border-transparent transition placeholder:text-[#C8C8C8]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1D1D1B] mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-[#C8C8C8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0080C6] focus:border-transparent transition placeholder:text-[#C8C8C8]"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0080C6] hover:bg-[#0068A3] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#C8C8C8] mt-6">
          ¿Problemas para acceder? Escríbenos a{' '}
          <a href="mailto:hola@nok.do" className="text-[#0080C6] hover:underline">hola@nok.do</a>
        </p>
      </div>
    </div>
  )
}
