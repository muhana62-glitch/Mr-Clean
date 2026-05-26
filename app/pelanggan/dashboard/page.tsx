'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { LogOut, Download } from 'lucide-react'

interface Order {
  id: string
  no_order: string
  tanggal_penerimaan: string
  total_harga: number
  status: string
  order_detail: any[]
}

export default function PelangganDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/pelanggan/login')
        return
      }
      setUser(currentUser)

      // Fetch pelanggan and orders
      const { data: pelangganData } = await supabase
        .from('pelanggan')
        .select('id')
        .eq('user_id', currentUser.id)
        .single()

      if (pelangganData) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            id,
            no_order,
            tanggal_penerimaan,
            total_harga,
            status,
            order_detail(*)
          `)
          .eq('pelanggan_id', pelangganData.id)
          .order('created_at', { ascending: false })

        if (ordersData) {
          setOrders(ordersData as any)
        }
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Pelanggan</h1>
            <p className="text-gray-600 text-sm mt-1">Kelola cucian Anda</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Riwayat Cucian */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Riwayat Cucian Saya</h2>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-600">
              Anda belum memiliki data cucian
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No. Order</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">{order.no_order}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.tanggal_penerimaan).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        Rp {order.total_harga.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'diterima' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'diproses' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'selesai' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <button className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                          <Download size={16} />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
