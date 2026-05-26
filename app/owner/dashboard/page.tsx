'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile, logoutUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatTanggal, getStatusLabel, getStatusColor } from '@/lib/utils'
import {
  LogOut, Home, TrendingUp, Package, Users, DollarSign,
  RefreshCw, BarChart2, Calendar,
} from 'lucide-react'

interface Order {
  id: number
  no_order: string
  tanggal_masuk: string
  total_harga: number
  status: string
  pelanggan: { users: { nama: string } } | null
}

interface Karyawan {
  id: number
  posisi: string | null
  status: string
  users: { nama: string; email: string }
}

export default function OwnerDashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'karyawan'>('overview')

  const fetchData = async () => {
    const [{ data: ordersData }, { data: karyawanData }] = await Promise.all([
      supabase
        .from('orders')
        .select(`id, no_order, tanggal_masuk, total_harga, status, pelanggan:pelanggan_id(users:user_id(nama))`)
        .order('tanggal_masuk', { ascending: false })
        .limit(200),
      supabase
        .from('karyawan')
        .select(`id, posisi, status, users:user_id(nama, email)`)
        .order('id'),
    ])
    if (ordersData) setOrders(ordersData as any)
    if (karyawanData) setKaryawanList(karyawanData as any)
  }

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user) { router.push('/owner/login'); return }
      const profile = await getUserProfile(user.id)
      // Kalau profile null tapi user ada, tetap lanjut
      if (profile && profile.role !== 'owner') { router.push('/owner/login'); return }
      setUserName(profile?.nama ?? 'Owner')
      await fetchData()
      setLoading(false)
    }
    init()
  }, [router])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  // Hitung statistik
  const totalPendapatan = orders
    .filter((o) => ['selesai', 'diambil'].includes(o.status))
    .reduce((sum, o) => sum + o.total_harga, 0)

  const bulanIni = new Date().getMonth()
  const tahunIni = new Date().getFullYear()
  const orderBulanIni = orders.filter((o) => {
    const d = new Date(o.tanggal_masuk)
    return d.getMonth() === bulanIni && d.getFullYear() === tahunIni
  })
  const pendapatanBulanIni = orderBulanIni
    .filter((o) => ['selesai', 'diambil'].includes(o.status))
    .reduce((sum, o) => sum + o.total_harga, 0)

  const statusCount = {
    diterima: orders.filter((o) => o.status === 'diterima').length,
    diproses: orders.filter((o) => o.status === 'diproses').length,
    selesai: orders.filter((o) => o.status === 'selesai').length,
    diambil: orders.filter((o) => o.status === 'diambil').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo_mrclean.png" alt="Mr. Clean" className="h-9 w-auto" />
            <div>
              <p className="font-bold text-gray-900 leading-none">Halo, {userName} 📊</p>
              <p className="text-xs text-gray-500 mt-0.5">Dashboard Owner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link href="/owner/master-data" className="hidden sm:flex items-center gap-1.5 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-3 py-2 rounded-lg transition">
              ⚙️ Master Data
            </Link>
            <Link href="/owner/karyawan" className="hidden sm:flex items-center gap-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-3 py-2 rounded-lg transition">
              👷 Karyawan
            </Link>
            <Link href="/" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
              <Home size={16} /> Beranda
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-100 p-1.5 rounded-lg"><DollarSign className="text-green-600" size={18} /></div>
              <p className="text-xs text-gray-500">Total Pendapatan</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatRupiah(totalPendapatan)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 p-1.5 rounded-lg"><Calendar className="text-blue-600" size={18} /></div>
              <p className="text-xs text-gray-500">Bulan Ini</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatRupiah(pendapatanBulanIni)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-purple-100 p-1.5 rounded-lg"><Package className="text-purple-600" size={18} /></div>
              <p className="text-xs text-gray-500">Total Order</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-orange-100 p-1.5 rounded-lg"><Users className="text-orange-600" size={18} /></div>
              <p className="text-xs text-gray-500">Karyawan Aktif</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{karyawanList.filter((k) => k.status === 'aktif').length}</p>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Diterima', count: statusCount.diterima, color: 'bg-blue-100 text-blue-800' },
            { label: 'Diproses', count: statusCount.diproses, color: 'bg-yellow-100 text-yellow-800' },
            { label: 'Selesai', count: statusCount.selesai, color: 'bg-green-100 text-green-800' },
            { label: 'Diambil', count: statusCount.diambil, color: 'bg-gray-100 text-gray-700' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${s.color}`}>
                {s.label}
              </span>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {[
            { key: 'overview', label: '📈 Overview', icon: BarChart2 },
            { key: 'orders', label: '📦 Semua Order', icon: Package },
            { key: 'karyawan', label: '👷 Karyawan', icon: Users },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Order Bulan Ini */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-green-600" size={20} />
                <h3 className="font-bold text-gray-900">Order Bulan Ini</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Order</span>
                  <span className="font-semibold">{orderBulanIni.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Selesai</span>
                  <span className="font-semibold text-green-600">
                    {orderBulanIni.filter((o) => ['selesai', 'diambil'].includes(o.status)).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pendapatan</span>
                  <span className="font-bold text-green-700">{formatRupiah(pendapatanBulanIni)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: orderBulanIni.length > 0
                        ? `${(orderBulanIni.filter((o) => ['selesai', 'diambil'].includes(o.status)).length / orderBulanIni.length) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {orderBulanIni.length > 0
                    ? `${Math.round((orderBulanIni.filter((o) => ['selesai', 'diambil'].includes(o.status)).length / orderBulanIni.length) * 100)}% selesai`
                    : 'Belum ada order'}
                </p>
              </div>
            </div>

            {/* Karyawan Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-blue-600" size={20} />
                <h3 className="font-bold text-gray-900">Ringkasan Karyawan</h3>
              </div>
              {karyawanList.length === 0 ? (
                <p className="text-gray-400 text-sm">Belum ada data karyawan</p>
              ) : (
                <div className="space-y-3">
                  {karyawanList.slice(0, 5).map((k) => (
                    <div key={k.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{k.users?.nama}</p>
                        <p className="text-xs text-gray-500">{k.posisi ?? 'Karyawan'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        k.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {k.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Terbaru */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-2">
              <h3 className="font-bold text-gray-900 mb-4">10 Order Terbaru</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="pb-3 text-left font-semibold text-gray-600">No. Order</th>
                      <th className="pb-3 text-left font-semibold text-gray-600">Pelanggan</th>
                      <th className="pb-3 text-left font-semibold text-gray-600">Tanggal</th>
                      <th className="pb-3 text-left font-semibold text-gray-600">Total</th>
                      <th className="pb-3 text-left font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((o) => (
                      <tr key={o.id} className="border-b border-gray-50">
                        <td className="py-3 font-mono text-gray-900">{o.no_order}</td>
                        <td className="py-3 text-gray-700">{o.pelanggan?.users?.nama ?? 'Tamu'}</td>
                        <td className="py-3 text-gray-500">{formatTanggal(o.tanggal_masuk)}</td>
                        <td className="py-3 font-semibold text-gray-900">{formatRupiah(o.total_harga)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(o.status)}`}>
                            {getStatusLabel(o.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Semua Order */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Semua Order ({orders.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">No. Order</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Pelanggan</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Tanggal</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Total</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-mono font-semibold text-gray-900">{o.no_order}</td>
                      <td className="px-5 py-4 text-gray-700">{o.pelanggan?.users?.nama ?? 'Tamu'}</td>
                      <td className="px-5 py-4 text-gray-500">{formatTanggal(o.tanggal_masuk)}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{formatRupiah(o.total_harga)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(o.status)}`}>
                          {getStatusLabel(o.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Karyawan */}
        {activeTab === 'karyawan' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Data Karyawan ({karyawanList.length})</h3>
            </div>
            {karyawanList.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Users className="mx-auto mb-3 text-gray-300" size={40} />
                <p>Belum ada data karyawan</p>
                <p className="text-xs mt-1">Tambahkan karyawan melalui Supabase dashboard</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Nama</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Email</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Posisi</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {karyawanList.map((k) => (
                      <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-5 py-4 font-semibold text-gray-900">{k.users?.nama}</td>
                        <td className="px-5 py-4 text-gray-600">{k.users?.email}</td>
                        <td className="px-5 py-4 text-gray-600">{k.posisi ?? 'Karyawan'}</td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            k.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {k.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
