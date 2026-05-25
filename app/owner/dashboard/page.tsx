'use client'

import Link from 'next/link'
import { LogOut, TrendingUp, DollarSign, Users, Home } from 'lucide-react'

export default function OwnerDashboard() {
  const stats = [
    { label: 'Total Pendapatan', value: 'Rp 2.5M', icon: '💰', color: 'green' },
    { label: 'Total Pesanan', value: '156', icon: '📦', color: 'blue' },
    { label: 'Karyawan Aktif', value: '5', icon: '👥', color: 'purple' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">📊 Owner Dashboard</h1>
            <p className="text-gray-600 text-sm">Mr. Clean Laundry System</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <Home size={20} />
              Home
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold text-purple-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Reports & Analytics */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Report */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-green-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Laporan Bulanan</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Mei 2025</span>
                <span className="font-bold text-gray-800">Rp 2.5M</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>

          {/* Employee Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Data Karyawan</h2>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600">✓ Aktif: <span className="font-bold">5</span></p>
              <p className="text-gray-600">○ Cuti: <span className="font-bold">1</span></p>
              <p className="text-gray-600">✕ Tidak Aktif: <span className="font-bold">0</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
