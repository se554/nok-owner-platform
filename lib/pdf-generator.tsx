'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff' },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '2px solid #1a1a1a',
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 8,
    color: '#666666',
    marginTop: 2,
    letterSpacing: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  docNumber: {
    fontSize: 8,
    color: '#888888',
    marginTop: 2,
  },
  // Info block
  infoBlock: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 4,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: '#1a1a1a',
    fontFamily: 'Helvetica-Bold',
  },
  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    backgroundColor: '#f0f0f0',
    padding: '6 8',
    marginBottom: 0,
  },
  // Table
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: '5 8',
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #eeeeee',
    padding: '6 8',
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    fontSize: 9,
    color: '#1a1a1a',
  },
  tableCellGray: {
    fontSize: 9,
    color: '#666666',
  },
  // Column widths
  colItem: { flex: 3 },
  colQty: { flex: 0.6, textAlign: 'center' },
  colColor: { flex: 1 },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1.2, textAlign: 'right' },
  // Status badges
  badgeHas: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: 7,
    padding: '1 4',
    borderRadius: 3,
  },
  badgeMissing: {
    backgroundColor: '#fef9c3',
    color: '#854d0e',
    fontSize: 7,
    padding: '1 4',
    borderRadius: 3,
  },
  // Totals
  totalsBlock: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666666',
  },
  totalValue: {
    fontSize: 10,
    color: '#1a1a1a',
    width: 100,
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    borderTop: '2px solid #1a1a1a',
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    width: 100,
    textAlign: 'right',
  },
  // Next steps
  nextSteps: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 4,
    marginBottom: 20,
  },
  nextStepsTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  nextStep: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  nextStepNum: {
    fontSize: 9,
    color: '#aaaaaa',
    width: 16,
  },
  nextStepText: {
    fontSize: 9,
    color: '#dddddd',
    flex: 1,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #eeeeee',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#aaaaaa',
  },
})

export type QuoteItem = {
  space: string
  item_name: string
  quantity: number
  color?: string
  unit_price: number
  currency: string
  status: 'missing' | 'has_it'
}

export type QuoteData = {
  session_id: string
  owner_name: string
  owner_email: string
  property_address: string
  property_city: string
  generated_at: string
  items: QuoteItem[]
  currency: string
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'DOP') {
    return `RD$${amount.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  if (currency === 'COP') {
    return `$${amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  return `$${amount.toFixed(2)}`
}

const SPACE_LABELS: Record<string, string> = {
  sala: 'Sala / Comedor',
  cocina: 'Cocina',
  habitacion: 'Habitaciones',
  baño: 'Baños',
  general: 'General',
  lavanderia: 'Lavandería',
  terraza: 'Terraza',
}

export function QuotePDF({ data }: { data: QuoteData }) {
  const spaces = [...new Set(data.items.map(i => i.space))]
  const purchaseItems = data.items.filter(i => i.status === 'missing')

  let grandTotal = 0
  for (const item of purchaseItems) {
    grandTotal += item.unit_price * item.quantity
  }

  const docNumber = `NOK-${data.session_id.slice(0, 8).toUpperCase()}`

  return (
    <Document title={`Cotización NOK — ${data.owner_name}`} author="NOK">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>NOK</Text>
            <Text style={styles.brandTagline}>GESTIÓN DE APARTAMENTOS</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>COTIZACIÓN DE ONBOARDING</Text>
            <Text style={styles.docNumber}>{docNumber} · {data.generated_at}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBlock}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Propietario</Text>
            <Text style={styles.infoValue}>{data.owner_name}</Text>
            <Text style={[styles.tableCell, { color: '#666666', marginTop: 2 }]}>{data.owner_email}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Propiedad</Text>
            <Text style={styles.infoValue}>{data.property_address}</Text>
            <Text style={[styles.tableCell, { color: '#666666', marginTop: 2 }]}>{data.property_city}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Total a invertir</Text>
            <Text style={styles.infoValue}>{formatCurrency(grandTotal, data.currency)}</Text>
            <Text style={[styles.tableCell, { color: '#666666', marginTop: 2 }]}>{purchaseItems.length} ítems</Text>
          </View>
        </View>

        {/* Items por espacio */}
        {spaces.map(space => {
          const spaceItems = purchaseItems.filter(i => i.space === space)
          if (spaceItems.length === 0) return null

          let spaceSub = 0
          spaceItems.forEach(i => { spaceSub += i.unit_price * i.quantity })

          return (
            <View key={space} style={styles.section}>
              <Text style={styles.sectionTitle}>{SPACE_LABELS[space] ?? space.toUpperCase()}</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.colItem]}>Ítem</Text>
                  <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
                  <Text style={[styles.tableHeaderCell, styles.colColor]}>Color</Text>
                  <Text style={[styles.tableHeaderCell, styles.colPrice]}>Precio unit.</Text>
                  <Text style={[styles.tableHeaderCell, styles.colTotal]}>Subtotal</Text>
                </View>
                {spaceItems.map((item, idx) => (
                  <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                    <Text style={[styles.tableCell, styles.colItem]}>{item.item_name}</Text>
                    <Text style={[styles.tableCell, styles.colQty, { textAlign: 'center' }]}>{item.quantity}</Text>
                    <Text style={[styles.tableCellGray, styles.colColor]}>{item.color ?? '—'}</Text>
                    <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unit_price, item.currency)}</Text>
                    <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.unit_price * item.quantity, item.currency)}</Text>
                  </View>
                ))}
                <View style={[styles.tableRow, { justifyContent: 'flex-end' }]}>
                  <Text style={[styles.tableCellGray, { marginRight: 8 }]}>Subtotal {SPACE_LABELS[space] ?? space}:</Text>
                  <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold', width: 100, textAlign: 'right' }]}>
                    {formatCurrency(spaceSub, data.currency)}
                  </Text>
                </View>
              </View>
            </View>
          )
        })}

        {/* Grand Total */}
        <View style={styles.totalsBlock}>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL INVERSIÓN</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal, data.currency)}</Text>
          </View>
          <Text style={[styles.tableCellGray, { fontSize: 7, marginTop: 4 }]}>
            * Los precios son referencias de catálogo. NOK gestiona la compra e instalación.
          </Text>
        </View>

        {/* Next Steps */}
        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>Próximos pasos</Text>
          {[
            'El equipo NOK revisará esta cotización en las próximas 24 horas.',
            'Un ejecutivo de cuenta te contactará para confirmar detalles y ajustes.',
            'Una vez aprobado, firmamos el contrato de gestión y comenzamos las compras.',
            'NOK coordina entrega, instalación y fotografía profesional del apartamento.',
            'Tu apartamento estará listo para recibir sus primeros huéspedes en 2–3 semanas.',
          ].map((step, i) => (
            <View key={i} style={styles.nextStep}>
              <Text style={styles.nextStepNum}>{i + 1}.</Text>
              <Text style={styles.nextStepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NOK · Gestión de Apartamentos de Corto Plazo</Text>
          <Text style={styles.footerText}>{docNumber}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
