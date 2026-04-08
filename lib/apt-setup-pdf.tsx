import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export type AptSetupQuoteItem = {
  name: string
  status: 'has_it' | 'missing' | 'not_nok_standard' | 'replace'
  quantity: number
  unit_price: number
  currency: string
}

export type AptSetupQuoteCategory = {
  category: string
  label: string
  items: AptSetupQuoteItem[]
}

export type AptSetupPhotoSummary = {
  category: string
  total_photos: number
  approved: number
  needs_review: number
  rejected: number
  issues: string[]
}

export type AptSetupQuoteData = {
  owner_name: string
  owner_email: string
  property_address: string
  property_city: string
  country: string
  bedrooms: number
  bathrooms: number
  quote_number?: string
  generated_at?: string
  categories: AptSetupQuoteCategory[]
  photo_summaries: AptSetupPhotoSummary[]
  cleaning_fee: number
  currency: string
}

const DARK = '#1D1D1B'
const GOLD = '#D6A700'
const WHITE = '#F2F2F2'
const GRAY = '#8A8A8A'
const LIGHT_GRAY = '#E8E8E8'
const SUCCESS = '#0E6845'
const DANGER = '#D32F2F'

const s = StyleSheet.create({
  // Cover page
  coverPage: { backgroundColor: DARK, padding: 60, justifyContent: 'center', alignItems: 'center', height: '100%' },
  coverLogo: { fontSize: 48, fontWeight: 'bold', color: WHITE, letterSpacing: 12, marginBottom: 8 },
  coverDivider: { width: 60, height: 2, backgroundColor: GOLD, marginVertical: 24 },
  coverTitle: { fontSize: 14, color: GOLD, letterSpacing: 6, fontWeight: 'light', marginBottom: 40 },
  coverAddress: { fontSize: 16, color: WHITE, textAlign: 'center', marginBottom: 4 },
  coverCity: { fontSize: 12, color: GRAY, textAlign: 'center', marginBottom: 32 },
  coverMeta: { fontSize: 9, color: GRAY, textAlign: 'center', lineHeight: 1.6 },

  // Content pages
  page: { backgroundColor: '#FFFFFF', padding: 40, paddingTop: 50, fontSize: 10 },
  headerBar: { height: 3, backgroundColor: GOLD, marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLogo: { fontSize: 18, fontWeight: 'bold', color: DARK, letterSpacing: 4 },
  headerQuote: { fontSize: 8, color: GRAY },

  // Info box
  infoBox: { backgroundColor: '#F5F5F5', borderRadius: 6, padding: 16, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between' },
  infoCol: {},
  infoLabel: { fontSize: 7, color: GRAY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  infoValue: { fontSize: 10, color: DARK, fontWeight: 'medium' },

  // Category section
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  categoryLabel: { fontSize: 11, fontWeight: 'bold', color: DARK },

  // Table
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LIGHT_GRAY, paddingBottom: 4, marginBottom: 4 },
  tableHeaderCell: { fontSize: 7, color: GRAY, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  tableRowMissing: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0', borderLeftWidth: 3, borderLeftColor: GOLD, paddingLeft: 6 },
  cellName: { flex: 3, fontSize: 9, color: DARK },
  cellStatus: { flex: 1.5, fontSize: 8 },
  cellQty: { flex: 0.5, fontSize: 9, color: DARK, textAlign: 'center' },
  cellPrice: { flex: 1.2, fontSize: 9, color: DARK, textAlign: 'right' },
  cellTotal: { flex: 1.2, fontSize: 9, color: DARK, textAlign: 'right', fontWeight: 'bold' },
  statusPresent: { color: SUCCESS, fontSize: 8 },
  statusMissing: { color: DANGER, fontSize: 8 },
  statusReplace: { color: GOLD, fontSize: 8 },

  // Subtotal
  subtotalRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 6, marginBottom: 4 },
  subtotalLabel: { fontSize: 8, color: GRAY, marginRight: 8 },
  subtotalValue: { fontSize: 9, fontWeight: 'bold', color: DARK, width: 80, textAlign: 'right' },

  // Grand total box
  totalBox: { backgroundColor: DARK, borderRadius: 8, padding: 20, marginTop: 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  totalLabel: { fontSize: 9, color: GRAY },
  totalValue: { fontSize: 10, color: WHITE },
  totalDivider: { height: 1, backgroundColor: '#333', marginVertical: 8 },
  totalGrandLabel: { fontSize: 11, color: WHITE, fontWeight: 'bold' },
  totalGrandValue: { fontSize: 16, color: GOLD, fontWeight: 'bold' },

  // CTA page
  ctaPage: { backgroundColor: DARK, padding: 60, justifyContent: 'center', height: '100%' },
  ctaTitle: { fontSize: 22, color: WHITE, fontWeight: 'light', marginBottom: 40, textAlign: 'center' },
  ctaStepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  ctaStepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  ctaStepNumText: { fontSize: 12, color: DARK, fontWeight: 'bold' },
  ctaStepText: { fontSize: 11, color: WHITE, flex: 1, lineHeight: 1.5, paddingTop: 4 },
  ctaFooter: { marginTop: 60, textAlign: 'center' },
  ctaEmail: { fontSize: 10, color: GOLD, textAlign: 'center' },
  ctaUrl: { fontSize: 9, color: GRAY, textAlign: 'center', marginTop: 4 },

  // Footer
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: GRAY },
})

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'COP') return `$${amount.toLocaleString('es-CO')}`
  if (currency === 'DOP') return `RD$${amount.toLocaleString('es-DO')}`
  return `$${amount.toLocaleString()}`
}

export function AptSetupQuotePDF({ data }: { data: AptSetupQuoteData }) {
  const currency = data.currency

  const missingItems = data.categories.flatMap(c => c.items.filter(i => i.status === 'missing'))
  const replaceItems = data.categories.flatMap(c => c.items.filter(i => i.status === 'not_nok_standard' || i.status === 'replace'))
  const presentItems = data.categories.flatMap(c => c.items.filter(i => i.status === 'has_it'))

  const missingTotal = missingItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const replaceTotal = replaceItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const cleaningFee = data.cleaning_fee
  const grandTotal = missingTotal + replaceTotal + cleaningFee

  return (
    <Document>
      {/* Cover page */}
      <Page size="A4" style={s.coverPage}>
        <Text style={s.coverLogo}>NOK</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverTitle}>COTIZACI&Oacute;N EXPRESS</Text>
        <Text style={s.coverAddress}>{data.property_address}</Text>
        <Text style={s.coverCity}>{data.property_city}, {data.country === 'CO' ? 'Colombia' : 'Rep. Dominicana'}</Text>
        <Text style={s.coverMeta}>
          {data.generated_at}{'\n'}
          {data.quote_number}{'\n\n'}
          Preparado por NOK{'\n'}
          nok.rent
        </Text>
      </Page>

      {/* Detail pages */}
      <Page size="A4" style={s.page} wrap>
        <View style={s.headerBar} />
        <View style={s.headerRow}>
          <Text style={s.headerLogo}>NOK</Text>
          <Text style={s.headerQuote}>{data.quote_number}</Text>
        </View>

        {/* Info box */}
        <View style={s.infoBox}>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>Propietario</Text>
            <Text style={s.infoValue}>{data.owner_name}</Text>
          </View>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>Propiedad</Text>
            <Text style={s.infoValue}>{data.property_address}</Text>
            <Text style={{ fontSize: 8, color: GRAY }}>{data.property_city} &middot; {data.bedrooms}H {data.bathrooms}B</Text>
          </View>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>Inversi&oacute;n total</Text>
            <Text style={{ ...s.infoValue, color: GOLD, fontSize: 14, fontWeight: 'bold' }}>{formatCurrency(grandTotal, currency)}</Text>
          </View>
        </View>

        {/* Category tables */}
        {data.categories.map(cat => {
          const catMissing = cat.items.filter(i => i.status !== 'has_it')
          const catSubtotal = catMissing.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

          return (
            <View key={cat.category} wrap={false}>
              <View style={s.categoryHeader}>
                <Text style={s.categoryLabel}>{cat.label}</Text>
              </View>

              {/* Table header */}
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { flex: 3 }]}>Item</Text>
                <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Estado</Text>
                <Text style={[s.tableHeaderCell, { flex: 0.5, textAlign: 'center' }]}>Cant.</Text>
                <Text style={[s.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>Precio</Text>
                <Text style={[s.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>Subtotal</Text>
              </View>

              {cat.items.map((item, j) => {
                const isMissing = item.status !== 'has_it'
                const rowStyle = isMissing ? s.tableRowMissing : s.tableRow
                const statusStyle = item.status === 'has_it' ? s.statusPresent : item.status === 'missing' ? s.statusMissing : s.statusReplace
                const statusLabel = item.status === 'has_it' ? 'Presente' : item.status === 'missing' ? '+ Faltante' : 'Reemplazar'

                return (
                  <View key={j} style={rowStyle}>
                    <Text style={s.cellName}>{item.name}</Text>
                    <Text style={[s.cellStatus, statusStyle]}>{statusLabel}</Text>
                    <Text style={s.cellQty}>{item.quantity}</Text>
                    <Text style={s.cellPrice}>{isMissing && item.unit_price > 0 ? formatCurrency(item.unit_price, currency) : '-'}</Text>
                    <Text style={s.cellTotal}>{isMissing && item.unit_price > 0 ? formatCurrency(item.unit_price * item.quantity, currency) : '-'}</Text>
                  </View>
                )
              })}

              {catSubtotal > 0 && (
                <View style={s.subtotalRow}>
                  <Text style={s.subtotalLabel}>Subtotal {cat.label}:</Text>
                  <Text style={s.subtotalValue}>{formatCurrency(catSubtotal, currency)}</Text>
                </View>
              )}
            </View>
          )
        })}

        {/* Grand total */}
        <View style={s.totalBox}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Items presentes</Text>
            <Text style={s.totalValue}>{presentItems.length} items</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Items faltantes</Text>
            <Text style={s.totalValue}>{missingItems.length} items - {formatCurrency(missingTotal, currency)}</Text>
          </View>
          {replaceItems.length > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Items a reemplazar</Text>
              <Text style={s.totalValue}>{replaceItems.length} items - {formatCurrency(replaceTotal, currency)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Preparaci&oacute;n</Text>
            <Text style={s.totalValue}>{formatCurrency(cleaningFee, currency)}</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={[s.totalRow, { marginBottom: 0 }]}>
            <Text style={s.totalGrandLabel}>Inversi&oacute;n total estimada</Text>
            <Text style={s.totalGrandValue}>{formatCurrency(grandTotal, currency)}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 7, color: GRAY, marginTop: 10 }}>
          * Esta cotizaci&oacute;n es estimada. El equipo NOK confirmar&aacute; valores finales.
        </Text>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>NOK &middot; nok.rent</Text>
          <Text>{data.quote_number}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* CTA page */}
      <Page size="A4" style={s.ctaPage}>
        <Text style={s.ctaTitle}>Listo para trabajar con NOK?</Text>

        {[
          'Aprueba esta cotizaci\u00f3n',
          'NOK prepara tu apartamento',
          'Empieza a generar ingresos',
        ].map((step, i) => (
          <View key={i} style={s.ctaStepRow}>
            <View style={s.ctaStepNum}>
              <Text style={s.ctaStepNumText}>{i + 1}</Text>
            </View>
            <Text style={s.ctaStepText}>{step}</Text>
          </View>
        ))}

        <View style={s.ctaFooter}>
          <Text style={s.ctaEmail}>hola@nok.rent</Text>
          <Text style={s.ctaUrl}>nok.rent</Text>
        </View>
      </Page>
    </Document>
  )
}
