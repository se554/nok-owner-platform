'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => createBrowserClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type CatalogItem = {
  id: string
  name: string
  provider: string
  category: string
  space_type: string | null
  country: string
  currency: string
  price: number
  is_nok_standard: boolean
  active: boolean
  photo_url: string | null
  purchase_url: string | null
  notes: string | null
}

type FormData = Omit<CatalogItem, 'id'> & { id?: string }

const CATEGORIES = ['cocina', 'sala', 'comedor', 'habitacion', 'baño', 'electrodomesticos', 'lenceria', 'toallas', 'terraza', 'general', 'tecnologia']
const SPACE_TYPES = ['cocina', 'sala', 'habitacion', 'baño', 'terraza', 'general', 'lavanderia']
const COUNTRIES = [{ value: 'DO', label: 'República Dominicana (DOP)' }, { value: 'CO', label: 'Colombia (COP)' }]

const EMPTY_FORM: FormData = {
  name: '', provider: '', category: 'cocina', space_type: 'cocina',
  country: 'DO', currency: 'DOP', price: 0,
  is_nok_standard: false, active: true,
  photo_url: '', purchase_url: '', notes: '',
}

export default function AdminCatalogPage() {
  const supabase = createClient()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCountry, setFilterCountry] = useState<'DO' | 'CO' | 'all'>('DO')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    let query = supabase.from('catalog_items').select('*').order('category').order('name')
    if (filterCountry !== 'all') query = query.eq('country', filterCountry)
    if (filterCategory !== 'all') query = query.eq('category', filterCategory)
    const { data } = await query
    setItems((data as CatalogItem[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filterCountry, filterCategory]) // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setForm({ ...EMPTY_FORM, country: filterCountry === 'all' ? 'DO' : filterCountry, currency: filterCountry === 'CO' ? 'COP' : 'DOP' })
    setShowForm(true)
  }

  const openEdit = (item: CatalogItem) => {
    setForm({ ...item })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      name: form.name,
      provider: form.provider,
      category: form.category,
      space_type: form.space_type || null,
      country: form.country,
      currency: form.currency,
      price: form.price,
      is_nok_standard: form.is_nok_standard,
      active: form.active,
      photo_url: form.photo_url || null,
      purchase_url: form.purchase_url || null,
      notes: form.notes || null,
    }

    if (form.id) {
      await supabase.from('catalog_items').update(payload).eq('id', form.id)
    } else {
      await supabase.from('catalog_items').insert(payload)
    }

    setSaving(false)
    setShowForm(false)
    load()
  }

  const handleToggleActive = async (item: CatalogItem) => {
    await supabase.from('catalog_items').update({ active: !item.active }).eq('id', item.id)
    load()
  }

  const filtered = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.provider.toLowerCase().includes(search.toLowerCase())
  )

  const totalDO = items.filter(i => i.country === 'DO').length
  const totalCO = items.filter(i => i.country === 'CO').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xl font-bold tracking-widest mr-3">NOK</span>
          <span className="text-gray-400 text-sm">/ Admin / Catálogo</span>
        </div>
        <button
          onClick={openNew}
          className="bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Nuevo ítem
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            <p className="text-xs text-gray-500 mt-1">Ítems totales</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{totalDO}</p>
            <p className="text-xs text-gray-500 mt-1">República Dominicana (DOP)</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{totalCO}</p>
            <p className="text-xs text-gray-500 mt-1">Colombia (COP)</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-48"
          />
          <select
            value={filterCountry}
            onChange={e => setFilterCountry(e.target.value as 'DO' | 'CO' | 'all')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">Todos los países</option>
            <option value="DO">República Dominicana</option>
            <option value="CO">Colombia</option>
          </select>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ítem</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">País</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">NOK std</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${!item.active ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.provider}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${item.country === 'DO' ? 'text-blue-600' : 'text-yellow-600'}`}>
                        {item.country}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {item.currency === 'DOP' ? 'RD$' : '$'}{item.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.is_nok_standard ? '✅' : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleActive(item)} className="text-lg">
                        {item.active ? '🟢' : '🔴'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-xs text-gray-500 hover:text-gray-900 font-medium"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">No hay ítems con estos filtros</div>
            )}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{form.id ? 'Editar ítem' : 'Nuevo ítem del catálogo'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del ítem *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Proveedor *</label>
                  <input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                    placeholder="IKEA, JUMBO, NOK..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">País *</label>
                  <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value, currency: e.target.value === 'CO' ? 'COP' : 'DOP' }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                    {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoría *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Espacio</label>
                  <select value={form.space_type ?? ''} onChange={e => setForm(f => ({ ...f, space_type: e.target.value || null }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                    <option value="">Sin asignar</option>
                    {SPACE_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Precio ({form.currency}) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL foto</label>
                  <input value={form.photo_url ?? ''} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL de compra</label>
                  <input value={form.purchase_url ?? ''} onChange={e => setForm(f => ({ ...f, purchase_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                  <textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
                </div>
                <div className="col-span-2 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_nok_standard} onChange={e => setForm(f => ({ ...f, is_nok_standard: e.target.checked }))}
                      className="w-4 h-4" />
                    <span className="text-sm text-gray-700">Estándar NOK</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                      className="w-4 h-4" />
                    <span className="text-sm text-gray-700">Activo</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:border-gray-400 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.provider}
                className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40">
                {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear ítem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
