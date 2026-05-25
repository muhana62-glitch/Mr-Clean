'use client'

import Link from 'next/link'
import { LogOut, Package, Clock, CheckCircle, Home } from 'lucide-react'

export default function KaryawanDashboard() {
  const stats = [
    { label: 'Pesanan Hari Ini', value: '12', icon: '📦', color: 'blue' },
    { label: 'Sedang Diproses', value: '8', icon: '⏳', color: 'yellow' },
    { label: 'Selesai', value: '4', icon: '✅', color: 'green' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">👷 Karyawan Dashboard</h1>
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
              className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold text-blue-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">📋 Pesanan Hari Ini</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No. Pesanan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pelanggan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Kategori</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((item) => (
                  <tr key={item} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">ORD-001{item}</td>
                    <td className="px-6 py-4 text-gray-600">Customer {item}</td>
                    <td className="px-6 py-4 text-gray-600">Regular Wash</td>
                    <td className="px-6 py-4">
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                        Processing
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:underline text-sm font-medium">
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
