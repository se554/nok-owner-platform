'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type CheckItemStatus = 'has_it' | 'missing' | 'not_nok_standard' | 'needs_photo'

export type CheckItem = {
  name: string
  status: CheckItemStatus
  quantity_needed: number
  unit_price: number
  currency: string
  link: string | null
  notes: string | null
  catalog_item_id: string | null
}

export type CategoryResults = {
  items: CheckItem[]
  total: number
  present: number
  missing: number
}

export type PhotoResult = {
  photo_url: string
  file_name: string
  category: string
  overall_status: 'approved' | 'needs_review' | 'rejected'
  score: number
  items_detected: string[]
  issues: string[]
  recommendation: string
}

export type WizardState = {
  // Property info
  property_address: string
  property_city: string
  owner_name: string
  owner_email: string
  owner_phone: string
  country: 'CO' | 'DO'
  bedrooms: number
  bathrooms: number

  // Step 1: Check results
  checkResults: Record<string, CategoryResults>
  checkComplete: boolean

  // Step 2: Photo results
  photoResults: PhotoResult[]
  photosComplete: boolean

  // Step 3: Quote
  quotePdfUrl: string | null
}

const defaultState: WizardState = {
  property_address: '',
  property_city: 'Bogotá',
  owner_name: '',
  owner_email: '',
  owner_phone: '',
  country: 'CO',
  bedrooms: 2,
  bathrooms: 2,
  checkResults: {},
  checkComplete: false,
  photoResults: [],
  photosComplete: false,
  quotePdfUrl: null,
}

type WizardContextType = {
  state: WizardState
  updateState: (updates: Partial<WizardState>) => void
  resetState: () => void
}

const WizardContext = createContext<WizardContextType | null>(null)

const STORAGE_KEY = 'nok-apt-setup-wizard'

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(defaultState)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setState({ ...defaultState, ...JSON.parse(saved) })
      } catch { /* ignore */ }
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, loaded])

  const updateState = (updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const resetState = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setState(defaultState)
  }

  if (!loaded) return null

  return (
    <WizardContext.Provider value={{ state, updateState, resetState }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used within WizardProvider')
  return ctx
}
