'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MessageCircle } from 'lucide-react'

const WA_LINK = 'https://wa.me/6281902156350?text=' + encodeURIComponent('Halo Mr. Clean, saya ingin bertanya tentang layanan laundry')

export default function NavbarHome() {
  const [dashboardLink, setDashboardLink] = useState<string | null>(null)
  const [dashboardLabel, setDashboardLabel] = useState('')

  useEffect(() => {
    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()

      if (profile?.role === 'owner') {
        setDashboardLink('/owner/dashboard')
        setDashboardLabel('Dashboard Owner')
      } else if (profile?.role === 'karyawan') {
        setDashboardLink('/karyawan/dashboard')
        setDashboardLabel('Dashboard Karyawan')
      } else if (profile?.role === 'pelanggan') {
        setDashboardLink('/pelanggan/dashboard')
        setDashboardLabel('Dashboard Saya')
      }
    }
    checkSession()
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo_mrclean.png" alt="Mr. Clean" className="h-10 w-auto" />
          <div>
            <span className="font-bold text-blue-900 text-lg leading-none">Mr. Clean</span>
            <span className="block text-xs text-gray-500 leading-none">One Stop Laundry</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#layanan" className="hover:text-blue-600 transition">Layanan</a>
          <a href="#kontak" className="hover:text-blue-600 transition">Kontak</a>
        </div>
        <div className="flex items-center gap-2">
          {dashboardLink ? (
            <Link
              href={dashboardLink}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
            >
              🏠 {dashboardLabel}
            </Link>
          ) : (
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}
