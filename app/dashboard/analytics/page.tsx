'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'

interface PropertyLite { id: string; name: string }
interface MonthRow {
  month: string; revenue: number; nights: number; checkouts: number;
  commission: number; cleaning: number; direct: number; utilities: number; maintenance: number;
  net: number; adr: number; occupancy: number
}
interface PropertySeries { id: string; name: string; months: MonthRow[] }

const COLORS = ['#B9B5DC', '#D6A700', '#0E6845', '#F20022', '#4D9DE0', '#E07A5F', '#8E44AD', '#16A085']

function fmtUSD(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}
function shortMonth(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
}

export default function AnalyticsPage() {
  const [properties, setProperties] = useState<PropertyLite[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [series, setSeries] = useState<PropertySeries[]>([])
  const [loading, setLoading] = useState(false)

  // Load property list from owner's accessible set
  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/analytics/properties')
      const j = await res.json()
      setProperties(j.properties ?? [])
      if (j.properties?.length) setSelected([j.properties[0].id])
    })()
  }, [])

  // Fetch timeseries whenever selection changes
  useEffect(() => {
    if (selected.length === 0) { setSeries([]); return }
    setLoading(true)
    fetch(`/api/analytics/timeseries?propertyIds=${selected.join(',')}`)
      .then((r) => r.json())
      .then((j) => setSeries(j.data ?? []))
      .finally(() => setLoading(false))
  }, [selected])

  // Combined chart data — one object per month, keys per property name
  const chartData = useMemo(() => {
    if (series.length === 0) return []
    const months = series[0].months.map((m) => m.month)
    return months.map((mk) => {
      const row: any = { month: shortMonth(mk) }
      for (const p of series) {
        const r = p.months.find((x) => x.month === mk)!
        row[`${p.name}_revenue`] = Math.round(r.revenue)
        row[`${p.name}_net`] = Math.round(r.net)
        row[`${p.name}_occupancy`] = Math.round(r.occupancy)
        row[`${p.name}_adr`] = Math.round(r.adr)
      }
      return row
    })
  }, [series])

  // Stacked cost breakdown (single property OR summed if multiple)
  const costBreakdown = useMemo(() => {
    if (series.length === 0) return []
    const months = series[0].months.map((m) => m.month)
    return months.map((mk) => {
      const row: any = { month: shortMonth(mk), commission: 0, cleaning: 0, direct: 0, utilities: 0, maintenance: 0 }
      for (const p of series) {
        const r = p.months.find((x) => x.month === mk)!
        row.commission += r.commission
        row.cleaning += r.cleaning
        row.direct += r.direct
        row.utilities += r.utilities
        row.maintenance += r.maintenance
      }
      for (const k of ['commission','cleaning','direct','utilities','maintenance']) row[k] = Math.round(row[k])
      return row
    })
  }, [series])

  // YTD cost donut totals (sum across selection)
  const costTotals = useMemo(() => {
    const t = { commission: 0, cleaning: 0, direct: 0, utilities: 0, maintenance: 0 }
    for (const p of series) for (const m of p.months) {
      t.commission += m.commission; t.cleaning += m.cleaning; t.direct += m.direct; t.utilities += m.utilities; t.maintenance += m.maintenance
    }
    return [
      { name: 'Comisión NOK', value: Math.round(t.commission) },
      { name: 'Limpieza', value: Math.round(t.cleaning) },
      { name: 'Reserva Directa', value: Math.round(t.direct) },
      { name: 'Utilities', value: Math.round(t.utilities) },
      { name: 'Mantenimiento', value: Math.round(t.maintenance) },
    ].filter((x) => x.value > 0)
  }, [series])

  const toggleProp = (id: string) => {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  }

  return (
    <div className="min-h-screen px-6 lg:px-10 py-10 max-w-7xl mx-auto" style={{ backgroundColor: '#1D1D1B' }}>
      <h1 className="font-serif text-4xl text-[#F2F2F2] mb-2">Analíticas</h1>
      <p className="text-sm text-[#F2F2F2]/50 mb-8">Últimos 12 meses · ingresos, ocupación, ADR y desglose de costos.</p>

      {/* Property multi-select */}
      <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#141413', border: '1px solid rgba(242,242,242,0.08)' }}>
        <p className="text-xs text-[#F2F2F2]/50 uppercase tracking-wider mb-2">Comparar propiedades ({selected.length})</p>
        <div className="flex flex-wrap gap-2">
          {properties.map((p) => {
            const active = selected.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggleProp(p.id)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  backgroundColor: active ? 'rgba(77,67,158,0.25)' : 'rgba(242,242,242,0.04)',
                  border: `1px solid ${active ? '#4D439E' : 'rgba(242,242,242,0.08)'}`,
                  color: active ? '#F2F2F2' : 'rgba(242,242,242,0.55)',
                }}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      {loading && <p className="text-[#F2F2F2]/50 text-sm">Cargando…</p>}

      {series.length > 0 && (
        <>
          {/* Revenue (line) */}
          <ChartCard title="Ingresos por mes (USD)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,242,242,0.06)" />
                <XAxis dataKey="month" stroke="rgba(242,242,242,0.4)" fontSize={11} />
                <YAxis stroke="rgba(242,242,242,0.4)" fontSize={11} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1C', border: '1px solid rgba(242,242,242,0.1)' }} formatter={(v: any) => fmtUSD(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {series.map((p, i) => (
                  <Line key={p.id} type="monotone" dataKey={`${p.name}_revenue`} name={p.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Net revenue (line) */}
          <ChartCard title="Ingreso neto propietario (USD)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,242,242,0.06)" />
                <XAxis dataKey="month" stroke="rgba(242,242,242,0.4)" fontSize={11} />
                <YAxis stroke="rgba(242,242,242,0.4)" fontSize={11} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1C', border: '1px solid rgba(242,242,242,0.1)' }} formatter={(v: any) => fmtUSD(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {series.map((p, i) => (
                  <Line key={p.id} type="monotone" dataKey={`${p.name}_net`} name={p.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Occupancy */}
          <ChartCard title="Ocupación (%)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,242,242,0.06)" />
                <XAxis dataKey="month" stroke="rgba(242,242,242,0.4)" fontSize={11} />
                <YAxis stroke="rgba(242,242,242,0.4)" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1C', border: '1px solid rgba(242,242,242,0.1)' }} formatter={(v: any) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {series.map((p, i) => (
                  <Line key={p.id} type="monotone" dataKey={`${p.name}_occupancy`} name={p.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ADR */}
          <ChartCard title="ADR (Tarifa promedio diaria, USD)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,242,242,0.06)" />
                <XAxis dataKey="month" stroke="rgba(242,242,242,0.4)" fontSize={11} />
                <YAxis stroke="rgba(242,242,242,0.4)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1C', border: '1px solid rgba(242,242,242,0.1)' }} formatter={(v: any) => fmtUSD(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {series.map((p, i) => (
                  <Line key={p.id} type="monotone" dataKey={`${p.name}_adr`} name={p.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Cost stacked bar */}
          <ChartCard title="Costos por mes (desglose)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={costBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,242,242,0.06)" />
                <XAxis dataKey="month" stroke="rgba(242,242,242,0.4)" fontSize={11} />
                <YAxis stroke="rgba(242,242,242,0.4)" fontSize={11} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1C', border: '1px solid rgba(242,242,242,0.1)' }} formatter={(v: any) => fmtUSD(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="commission" stackId="a" name="Comisión NOK" fill="#B9B5DC" />
                <Bar dataKey="cleaning" stackId="a" name="Limpieza" fill="#D6A700" />
                <Bar dataKey="direct" stackId="a" name="Reserva Directa" fill="#0E6845" />
                <Bar dataKey="utilities" stackId="a" name="Utilities" fill="#4D9DE0" />
                <Bar dataKey="maintenance" stackId="a" name="Mantenimiento" fill="#F20022" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Cost distribution donut (12m total) */}
          <ChartCard title="Distribución de costos (últimos 12 meses)">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={costTotals} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {costTotals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1C', border: '1px solid rgba(242,242,242,0.1)' }} formatter={(v: any) => fmtUSD(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 p-5 rounded-xl" style={{ backgroundColor: '#141413', border: '1px solid rgba(242,242,242,0.08)' }}>
      <h3 className="text-sm text-[#F2F2F2]/80 mb-3 font-medium">{title}</h3>
      {children}
    </div>
  )
}
