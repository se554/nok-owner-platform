'use client'

import { WizardProvider } from '@/components/apt-setup/WizardContext'
import ProgressBar from '@/components/apt-setup/ProgressBar'
import Image from 'next/image'
import Link from 'next/link'

export default function AptSetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <WizardProvider>
      <div className="min-h-screen bg-[#1D1D1B] text-[#F2F2F2]">
        {/* Header */}
        <header className="border-b border-[rgba(242,242,242,0.08)] px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/apt-setup" className="flex items-center gap-3">
              <Image src="/nok_blanco.png" alt="NOK" width={80} height={22} />
              <span className="text-[rgba(242,242,242,0.3)] text-xs font-medium tracking-widest uppercase hidden lg:block">
                Apt Setup
              </span>
            </Link>
            <ProgressBar />
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[rgba(242,242,242,0.06)] px-6 py-6 mt-auto">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-[rgba(242,242,242,0.25)]">
            <span>NOK &middot; nok.rent</span>
            <a href="mailto:hola@nok.rent" className="hover:text-[#D6A700] transition-colors">
              hola@nok.rent
            </a>
          </div>
        </footer>
      </div>
    </WizardProvider>
  )
}
