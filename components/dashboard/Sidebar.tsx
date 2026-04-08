'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Owner, Property } from '@/lib/types/database'

interface SidebarProps {
  owner: Owner
  properties: Property[]
}

const navItems = (propertyId: string) => [
  { label: 'Resumen', href: `/dashboard/${propertyId}/overview`, icon: '◎' },
  { label: 'Calendario', href: `/dashboard/${propertyId}/calendar`, icon: '🗓️' },
  { label: 'Reservas', href: `/dashboard/${propertyId}/reservations`, icon: '📅' },
  { label: 'Reseñas', href: `/dashboard/${propertyId}/reviews`, icon: '⭐' },
  { label: 'Inventario', href: `/dashboard/${propertyId}/inventory`, icon: '📦' },
  { label: 'Historial', href: `/dashboard/${propertyId}/history`, icon: '🧹' },
  { label: 'Chat IA', href: `/dashboard/${propertyId}/chat`, icon: '💬' },
]

const adminItems = [
  { label: 'Cotizaciones', href: '/admin/onboarding', icon: '📋' },
  { label: 'Catálogo', href: '/admin/catalog', icon: '🛍️' },
  { label: 'Apt Setup', href: '/apt-setup', icon: '🏠' },
  { label: 'Nueva cotización', href: '/onboarding', icon: '➕' },
]

export default function Sidebar({ owner, properties }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const activePropertyId = properties.find(p =>
    pathname.includes(p.id)
  )?.id ?? properties[0]?.id

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">NOK Owner Portal</span>
        </div>
      </div>

      {/* Property selector */}
      {properties.length > 1 && (
        <div className="px-4 pt-4">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Propiedad
          </label>
          <select
            value={activePropertyId}
            onChange={e => router.push(`/dashboard/${e.target.value}/overview`)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {properties.length === 1 && (
        <div className="px-4 pt-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Propiedad</p>
          <p className="text-sm font-medium text-gray-900 truncate">{properties[0].name}</p>
          {properties[0].city && (
            <p className="text-xs text-gray-400">{properties[0].city}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      {activePropertyId && (
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems(activePropertyId).map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href)
            const isChat = item.label === 'Chat IA'
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-black text-white'
                    : isChat
                      ? 'text-gray-700 hover:bg-gray-100 border border-dashed border-gray-300 mt-2'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
                {isChat && !isActive && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-normal">
                    AI
                  </span>
                )}
              </Link>
            )
          })}

          {/* Admin section */}
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">NOK Ops</p>
            {adminItems.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href)
              const isNew = item.label === 'Nueva cotización'
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-[#0080C6] text-white'
                      : isNew
                        ? 'text-[#0080C6] hover:bg-[#E6F3FB]'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* Owner info + sign out */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
            <span className="text-gray-600 text-xs font-semibold">
              {owner.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{owner.name}</p>
            <p className="text-xs text-gray-400 truncate">{owner.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-sm text-gray-500 hover:text-gray-800 text-left transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
