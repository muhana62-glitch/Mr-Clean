'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile, logoutUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatTanggal, getStatusLabel, getStatusColor } from '@/lib/utils'
import { LogOut, Home, Plus, RefreshCw, Package, Clock, CheckCircle, ChevronDown, Search } from 'lucide-react'

interface Order {
  id: number
  no_order: string
  tanggal_masuk: string
  total_harga: number
  status: string
  catatan: string | null
  jenis_pengiriman: string | null
  pelanggan: { nama: string; no_wa: string } | null
}

const STATUS_OPTIONS = ['diterima', 'diproses', 'selesai', 'diambil', 'dibatalkan']

export default function KaryawanDashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [newOrderCount, setNewOrderCount] = useState(0)

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, no_order, tanggal_masuk, total_harga, status, catatan, jenis_pengiriman, pelanggan:pelanggan_id(nama, no_wa)')
      .order('tanggal_masuk', { ascending: false })
      .limit(100)
    if (data) setOrders(data as any)
  }

  useEffect(() => {
    let channel: any = null

    async function init() {
      const user = await getCurrentUser()
      if (!user) { router.push('/karyawan/login'); return }
      const profile = await getUserProfile(user.id)
      if (profile && profile.role !== 'karyawan') { router.push('/karyawan/login'); return }
      setUserName(profile?.nama ?? 'Karyawan')
      await fetchOrders()

      // Realtime: order baru masuk otomatis muncul tanpa refresh
      channel = supabase
        .channel('karyawan-orders-realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        }, () => {
          fetchOrders()
          setNewOrderCount(prev => prev + 1)
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        }, (payload) => {
          setOrders(prev =>
            prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
          )
        })
        .subscribe()

      setLoading(false)
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [router])

  const handleRefresh = async () => {
    setRefreshing(true)
    setNewOrderCount(0)
    await fetchOrders()
    setRefreshing(false)
  }

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

    // WA otomatis saat status selesai
    if (newStatus === 'selesai') {
      const order = orders.find(o => o.id === orderId)
      if (order?.pelanggan?.no_wa) {
        const nama = order.pelanggan.nama ?? 'Pelanggan'
        const noWa = order.pelanggan.no_wa.replace(/^0/, '62').replace(/\D/g, '')
        const pesan = `Halo ${nama} 👋\n\nCucian Anda di *Mr. Clean One Stop Laundry* sudah *selesai* dan siap diambil! 🎉\n\n📋 No. Order: *${order.no_order}*\n\nSilakan datang ke toko kami atau hubungi kami untuk pengiriman.\n\n_Mr. Clean Laundry - Limbangan Wetan, Brebes_\n_WA: 081902156350_`
        window.open(`https://wa.me/${noWa}?text=${encodeURIComponent(pesan)}`, '_blank')
      }
    }
  }

  const handleWANotif = async (order: Order) => {
    // Ambil detail item cucian
    const { data: details } = await supabase
      .from('order_detail')
      .select('nama_item, kuantitas, kategori')
      .eq('order_id', order.id)

    const nama = order.pelanggan?.nama ?? 'Pelanggan'
    const noWa = order.pelanggan?.no_wa ?? ''
    if (!noWa) { alert('Nomor WhatsApp pelanggan tidak tersedia.'); return }

    // Buat daftar item
    const itemList = details && details.length > 0
      ? details.map((d: any) => `  - ${d.nama_item} (${d.kuantitas} ${d.kategori === 'kiloan' ? 'kg' : 'pcs'})`).join('\n')
      : '  - (tidak ada detail)'

    const statusLabel = getStatusLabel(order.status)
    const pesan = `Halo ${nama} 👋\n\nKami dari *Mr. Clean One Stop Laundry* ingin memberitahukan bahwa cucian Anda dengan:\n\n📋 *No. Order:* ${order.no_order}\n🧺 *Item Cucian:*\n${itemList}\n\n✅ *Status:* ${statusLabel}\n\n${
      order.status === 'selesai'
        ? 'Cucian Anda sudah *selesai* dan siap untuk diambil. Silakan datang ke Mr. Clean atau hubungi kami untuk pengiriman. 🎉'
        : order.status === 'diproses'
        ? 'Cucian Anda sedang *dalam proses* pencucian. Kami akan segera memberitahu jika sudah selesai.'
        : order.status === 'diambil'
        ? 'Terima kasih telah menggunakan layanan *Mr. Clean Laundry*. Sampai jumpa lagi! 😊'
        : `Status cucian Anda: *${statusLabel}*`
    }\n\nTerima kasih telah mempercayakan cucian Anda kepada kami! 🙏\n\n_Mr. Clean One Stop Laundry_\n_Limbangan Wetan, Brebes_\n_WA: 081902156350_`

    const waNumber = noWa.replace(/^0/, '62').replace(/\D/g, '')
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(pesan)}`
    window.open(waUrl, '_blank')
  }

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  const filtered = orders.filter(o => {
    const matchSearch = search === '' ||
      o.no_order.toLowerCase().includes(search.toLowerCase()) ||
      (o.pelanggan?.nama ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'semua' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: orders.length,
    aktif: orders.filter(o => ['diterima', 'diproses'].includes(o.status)).length,
    selesai: orders.filter(o => o.status === 'selesai').length,
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Memuat data...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo_mrclean.png" alt="Mr. Clean" className="h-9 w-auto" />
            <div>
              <p className="font-bold text-gray-900 leading-none">Halo, {userName} 👷</p>
              <p className="text-xs text-gray-500 mt-0.5">Dashboard Karyawan</p>
            </div>
            {newOrderCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                +{newOrderCount} order baru
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
              <Home size={16} /> Beranda
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition">
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><Package className="text-blue-600" size={20} /></div>
              <div><p className="text-xs text-gray-500">Total Order</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg"><Clock className="text-yellow-600" size={20} /></div>
              <div><p className="text-xs text-gray-500">Sedang Aktif</p><p className="text-2xl font-bold text-gray-900">{stats.aktif}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg"><CheckCircle className="text-green-600" size={20} /></div>
              <div><p className="text-xs text-gray-500">Selesai</p><p className="text-2xl font-bold text-gray-900">{stats.selesai}</p></div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari no. order atau nama pelanggan..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="semua">Semua Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link href="/karyawan/order"
            className="flex items-center justify-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition font-semibold">
            <Plus size={16} /> Input Order Baru
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">No. Order</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Pelanggan</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Pengiriman</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Tanggal</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Total</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">Tidak ada order ditemukan</td></tr>
                ) : (
                  filtered.map(order => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-mono font-semibold text-gray-900">
                        <Link href={`/karyawan/order/${order.id}`} className="text-blue-600 hover:underline">
                          {order.no_order}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{order.pelanggan?.nama ?? 'Tamu'}</p>
                        <p className="text-xs text-gray-500">{order.pelanggan?.no_wa ?? '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-600">
                        {order.jenis_pengiriman === 'jemput' ? '🚗 Dijemput' : '🚶 Diantar'}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{formatTanggal(order.tanggal_masuk)}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{formatRupiah(order.total_harga)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <select value={order.status} onChange={e => handleUpdateStatus(order.id, e.target.value)}
                              className="appearance-none border border-gray-300 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                          </div>
                          {/* Tombol WA notif ke pelanggan */}
                          <button
                            onClick={() => handleWANotif(order)}
                            title="Kirim notifikasi WhatsApp ke pelanggan"
                            className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L0 24l6.335-1.508A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.732.888.936-3.618-.235-.372A9.818 9.818 0 1112 21.818z"/>
                            </svg>
                          </button>
                          {/* Konfirmasi order dari pelanggan */}
                          {order.status === 'diterima' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'diproses')}
                              title="Konfirmasi barang diterima, kirim ke pusat"
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-lg transition font-medium"
                            >
                              ✓ Konfirmasi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
