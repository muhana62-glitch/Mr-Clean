'use client'

import Link from 'next/link'
import { LogOut, Plus, Package, Clock, CheckCircle, Home } from 'lucide-react'

export default function CustomerDashboard() {
  const orders = [
    { id: 1, number: 'ORD-001', status: 'completed', date: '2025-05-20', amount: 'Rp 150.000' },
    { id: 2, number: 'ORD-002', status: 'processing', date: '2025-05-23', amount: 'Rp 200.000' },
    { id: 3, number: 'ORD-003', status: 'pending', date: '2025-05-25', amount: 'Rp 175.000' },
  ]

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-900">👕 Customer Dashboard</h1>
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
        {/* New Order Button */}
        <div className="mb-8">
          <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
            <Plus size={20} />
            Pesan Laundry Baru
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <div className="flex items-center gap-3">
              <Package className="text-green-600" size={24} />
              <div>
                <p className="text-gray-600 text-sm">Total Pesanan</p>
                <p className="text-2xl font-bold text-green-900">15</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-600" size={24} />
              <div>
                <p className="text-gray-600 text-sm">Sedang Diproses</p>
                <p className="text-2xl font-bold text-blue-900">1</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="text-gray-600 text-sm">Selesai</p>
                <p className="text-2xl font-bold text-green-900">14</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">📋 Riwayat Pesanan</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No. Pesanan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{order.number}</td>
                    <td className="px-6 py-4 text-gray-600">{order.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{order.amount}</td>
                    <td className="px-6 py-4">
                      <button className="text-green-600 hover:underline text-sm font-medium">
                        Detail
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
