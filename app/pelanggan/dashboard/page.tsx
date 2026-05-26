'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile, logoutUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatTanggal, getStatusLabel, getStatusColor } from '@/lib/utils'
import { LogOut, Package, Clock, CheckCircle, MessageCircle, Home, RefreshCw } from 'lucide-react'

interface Order {
  id: number
  no_order: string
  tanggal_masuk: string
  total_harga: number
  status: string
  catatan: string | null
}

export default function PelangganDashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (userId: string) => {
    const { data: pelangganData } = await supabase
      .from('pelanggan')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!pelangganData) return

    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, no_order, tanggal_masuk, total_harga, status, catatan')
      .eq('pelanggan_id', pelangganData.id)
      .order('tanggal_masuk', { ascending: false })

    if (ordersData) setOrders(ordersData as Order[])
  }

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/pelanggan/login')
        return
      }
      const profile = await getUserProfile(user.id)
      // Kalau profile null tapi session ada, tetap lanjut
      if (profile && profile.role !== 'pelanggan') {
        router.push('/pelanggan/login')
        return
      }
      setUserName(profile?.nama ?? 'Pelanggan')
      await fetchData(user.id)
      setLoading(false)
    }
    init()
  }, [router])

  const handleRefresh = async () => {
    setRefreshing(true)
    const user = await getCurrentUser()
    if (user) await fetchData(user.id)
    setRefreshing(false)
  }

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  const stats = {
    total: orders.length,
    diproses: orders.filter((o) => ['diterima', 'diproses'].includes(o.status)).length,
    selesai: orders.filter((o) => ['selesai', 'diambil'].includes(o.status)).length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧺</span>
            <div>
              <p className="font-bold text-gray-900 leading-none">Halo, {userName} 👋</p>
              <p className="text-xs text-gray-500 mt-0.5">Dashboard Pelanggan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <Home size={16} />
              Beranda
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Order</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Diproses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.diproses}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Selesai</p>
                <p className="text-2xl font-bold text-gray-900">{stats.selesai}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Riwayat Cucian Saya</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-5xl block mb-4">🧺</span>
              <p className="text-gray-500 font-medium">Belum ada cucian</p>
              <p className="text-gray-400 text-sm mt-1">
                Hubungi kami via WhatsApp untuk mulai pesan laundry
              </p>
              <a
                href={`https://wa.me/6281902156350?text=${encodeURIComponent('Halo Mr. Clean, saya ingin pesan laundry')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              >
                <MessageCircle size={16} />
                Pesan via WhatsApp
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">No. Order</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Tanggal Masuk</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Total</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono font-semibold text-gray-900">{order.no_order}</td>
                      <td className="px-6 py-4 text-gray-600">{formatTanggal(order.tanggal_masuk)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{formatRupiah(order.total_harga)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{order.catatan ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* WA CTA */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-green-900">Ada pertanyaan tentang cucian Anda?</p>
            <p className="text-green-700 text-sm">Hubungi kami langsung via WhatsApp</p>
          </div>
          <a
            href={`https://wa.me/6281902156350?text=${encodeURIComponent('Halo Mr. Clean, saya ingin menanyakan status cucian saya')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm whitespace-nowrap"
          >
            <MessageCircle size={16} />
            Chat WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
