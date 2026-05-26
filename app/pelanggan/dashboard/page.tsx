'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile, logoutUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatTanggal, getStatusLabel, getStatusColor } from '@/lib/utils'
import {
  LogOut, Package, Clock, CheckCircle, MessageCircle,
  Home, RefreshCw, Plus, X, Send, ChevronDown,
} from 'lucide-react'

interface Order {
  id: number
  no_order: string
  tanggal_masuk: string
  total_harga: number
  status: string
  catatan: string | null
  jenis_pengiriman: string | null
}

interface JenisCucian {
  id: number
  nama: string
  kategori: string
  harga_kiloan: number | null
  harga_satuan: number | null
  satuan: string
}

interface OrderItem {
  jenis_id: string
  nama: string
  kategori_harga: 'kiloan' | 'satuan'
  kuantitas: number
  harga: number
  subtotal: number
}

const WA_LINK = 'https://wa.me/6281902156350?text=' + encodeURIComponent('Halo Mr. Clean, saya ingin bertanya tentang layanan laundry')

export default function PelangganDashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [pelangganId, setPelangganId] = useState<number | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [jenisCucian, setJenisCucian] = useState<JenisCucian[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Form pesan
  const [showForm, setShowForm] = useState(false)
  const [jenisPengiriman, setJenisPengiriman] = useState<'antar' | 'jemput'>('antar')
  const [catatan, setCatatan] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [filterKategori, setFilterKategori] = useState('Semua')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchOrders = async (pid: number) => {
    const { data } = await supabase
      .from('orders')
      .select('id, no_order, tanggal_masuk, total_harga, status, catatan, jenis_pengiriman')
      .eq('pelanggan_id', pid)
      .order('tanggal_masuk', { ascending: false })
    if (data) setOrders(data as Order[])
  }

  useEffect(() => {
    let channel: any = null

    async function init() {
      const user = await getCurrentUser()
      if (!user) { router.push('/pelanggan/login'); return }
      const profile = await getUserProfile(user.id)
      if (profile && profile.role !== 'pelanggan') { router.push('/pelanggan/login'); return }
      setUserName(profile?.nama ?? 'Pelanggan')

      // Ambil pelanggan id
      const { data: pel } = await supabase
        .from('pelanggan').select('id').eq('user_id', user.id).single()
      if (pel) {
        setPelangganId(pel.id)
        await fetchOrders(pel.id)

        // Realtime: update status otomatis tanpa refresh
        channel = supabase
          .channel(`orders-pelanggan-${pel.id}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          }, (payload) => {
            // Filter di client berdasarkan pelanggan_id
            if (payload.new.pelanggan_id === pel.id) {
              setOrders(prev =>
                prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
              )
            }
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
          }, (payload) => {
            if (payload.new.pelanggan_id === pel.id) {
              fetchOrders(pel.id)
            }
          })
          .subscribe((status) => {
            console.log('Realtime status:', status)
          })
      }

      // Ambil jenis cucian
      const { data: jc } = await supabase
        .from('jenis_cucian').select('id, nama, kategori, harga_kiloan, harga_satuan, satuan')
        .eq('is_active', true).order('kategori').order('nama')
      if (jc) setJenisCucian(jc as JenisCucian[])

      setLoading(false)
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [router])

  const handleRefresh = async () => {
    if (!pelangganId) return
    setRefreshing(true)
    await fetchOrders(pelangganId)
    setRefreshing(false)
  }

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  // Toggle item di form pesan
  const toggleItem = (jc: JenisCucian) => {
    const existing = items.find(i => i.jenis_id === String(jc.id))
    if (existing) {
      setItems(items.filter(i => i.jenis_id !== String(jc.id)))
    } else {
      const harga = jc.harga_satuan ?? jc.harga_kiloan ?? 0
      const kategori_harga: 'kiloan' | 'satuan' = jc.harga_satuan ? 'satuan' : 'kiloan'
      setItems([...items, {
        jenis_id: String(jc.id),
        nama: jc.nama,
        kategori_harga,
        kuantitas: 1,
        harga,
        subtotal: harga,
      }])
    }
  }

  const updateKuantitas = (jenis_id: string, val: number) => {
    setItems(items.map(i => i.jenis_id === jenis_id
      ? { ...i, kuantitas: val, subtotal: i.harga * val }
      : i
    ))
  }

  const totalHarga = items.reduce((s, i) => s + i.subtotal, 0)

  const handleSubmit = async () => {
    setFormError('')
    if (items.length === 0) { setFormError('Pilih minimal 1 item cucian.'); return }
    if (!pelangganId) { setFormError('Data pelanggan tidak ditemukan.'); return }
    setSubmitting(true)
    try {
      // Generate no order
      const now = new Date()
      const noOrder = `MRC-${now.getFullYear().toString().slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`

      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        no_order: noOrder,
        pelanggan_id: pelangganId,
        jenis_pengiriman: jenisPengiriman,
        total_harga: totalHarga,
        status: 'diterima',
        catatan: catatan || null,
      }).select().single()
      if (orderErr) throw orderErr

      const details = items.map(item => ({
        order_id: order.id,
        jenis_cucian_id: Number(item.jenis_id),
        nama_item: item.nama,
        kategori: item.kategori_harga,
        kuantitas: item.kuantitas,
        harga_satuan: item.harga,
        subtotal: item.subtotal,
      }))
      await supabase.from('order_detail').insert(details)

      setSuccessMsg(`Order ${noOrder} berhasil dikirim! Kami akan segera memproses cucian Anda.`)
      setShowForm(false)
      setItems([])
      setCatatan('')
      await fetchOrders(pelangganId)
    } catch (err: any) {
      setFormError(err.message ?? 'Gagal mengirim order.')
    } finally {
      setSubmitting(false)
    }
  }

  const kategoriList = ['Semua', ...Array.from(new Set(jenisCucian.map(j => j.kategori)))]
  const filteredJenis = filterKategori === 'Semua'
    ? jenisCucian
    : jenisCucian.filter(j => j.kategori === filterKategori)

  const stats = {
    total: orders.length,
    aktif: orders.filter(o => ['diterima','diproses'].includes(o.status)).length,
    selesai: orders.filter(o => ['selesai','diambil'].includes(o.status)).length,
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧺</span>
            <div>
              <p className="font-bold text-gray-900 leading-none">Halo, {userName} 👋</p>
              <p className="text-xs text-gray-500 mt-0.5">Dashboard Pelanggan</p>
            </div>
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

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Success message */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start justify-between">
            <p className="text-green-800 text-sm font-medium">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="text-green-400 hover:text-green-600 ml-3"><X size={16} /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><Package className="text-blue-600" size={20} /></div>
              <div><p className="text-xs text-gray-500">Total Cucian</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg"><Clock className="text-yellow-600" size={20} /></div>
              <div><p className="text-xs text-gray-500">Diproses</p><p className="text-2xl font-bold text-gray-900">{stats.aktif}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg"><CheckCircle className="text-green-600" size={20} /></div>
              <div><p className="text-xs text-gray-500">Selesai</p><p className="text-2xl font-bold text-gray-900">{stats.selesai}</p></div>
            </div>
          </div>
        </div>

        {/* Tombol Pesan + WA */}
        <div className="flex gap-3">
          <button onClick={() => { setShowForm(true); setSuccessMsg('') }}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition">
            <Plus size={20} /> Pesan Laundry
          </button>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-xl transition">
            <MessageCircle size={20} /> WhatsApp
          </a>
        </div>

        {/* Form Pesan Laundry */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Pesan Laundry Baru</h3>
              <button onClick={() => { setShowForm(false); setItems([]); setFormError('') }}
                className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{formError}</div>
              )}

              {/* Jenis Pengiriman */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Jenis Pengiriman</p>
                <div className="flex gap-3">
                  {(['antar', 'jemput'] as const).map(j => (
                    <button key={j} onClick={() => setJenisPengiriman(j)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${jenisPengiriman === j ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {j === 'antar' ? '🚶 Saya antar ke Mr. Clean' : '🚗 Minta dijemput'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pilih Item */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Pilih Item Cucian</p>
                {/* Filter kategori */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {kategoriList.map(k => (
                    <button key={k} onClick={() => setFilterKategori(k)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${filterKategori === k ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>
                      {k}
                    </button>
                  ))}
                </div>
                {/* Grid item */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {filteredJenis.map(jc => {
                    const selected = items.find(i => i.jenis_id === String(jc.id))
                    return (
                      <button key={jc.id} onClick={() => toggleItem(jc)}
                        className={`text-left p-3 rounded-xl border-2 transition text-sm ${selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300 bg-white'}`}>
                        <p className="font-medium text-gray-900 leading-tight">{jc.nama}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {jc.harga_satuan ? formatRupiah(jc.harga_satuan) + '/' + jc.satuan : jc.harga_kiloan ? formatRupiah(jc.harga_kiloan) + '/kg' : 'Harga belum diset'}
                        </p>
                        {selected && <span className="text-xs text-green-600 font-semibold">✓ Dipilih</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Item yang dipilih + qty */}
              {items.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Item Dipilih ({items.length})</p>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.jenis_id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.nama}</p>
                          <p className="text-xs text-gray-500">{formatRupiah(item.harga)}/{item.kategori_harga === 'kiloan' ? 'kg' : 'pcs'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateKuantitas(item.jenis_id, Math.max(0.5, item.kuantitas - (item.kategori_harga === 'kiloan' ? 0.5 : 1)))}
                            className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 transition">−</button>
                          <span className="w-10 text-center text-sm font-semibold">{item.kuantitas}</span>
                          <button onClick={() => updateKuantitas(item.jenis_id, item.kuantitas + (item.kategori_harga === 'kiloan' ? 0.5 : 1))}
                            className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center font-bold text-green-700 transition">+</button>
                        </div>
                        <p className="text-sm font-bold text-gray-900 w-24 text-right">{formatRupiah(item.subtotal)}</p>
                        <button onClick={() => setItems(items.filter(i => i.jenis_id !== item.jenis_id))}
                          className="text-red-400 hover:text-red-600"><X size={15} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between items-center bg-green-50 rounded-xl px-4 py-3">
                    <span className="font-semibold text-gray-700">Estimasi Total</span>
                    <span className="font-bold text-green-700 text-lg">{formatRupiah(totalHarga)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">* Total final akan dikonfirmasi oleh karyawan Mr. Clean</p>
                </div>
              )}

              {/* Catatan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan (opsional)</label>
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
                  placeholder="Contoh: ada noda membandel di bagian kerah, tolong diperhatikan..."
                  rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>

              <button onClick={handleSubmit} disabled={submitting || items.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2">
                <Send size={18} /> {submitting ? 'Mengirim...' : 'Kirim Pesanan'}
              </button>
            </div>
          </div>
        )}

        {/* Riwayat Cucian */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Riwayat Cucian Saya</h2>
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-5xl block mb-4">🧺</span>
              <p className="text-gray-500 font-medium">Belum ada riwayat cucian</p>
              <p className="text-gray-400 text-sm mt-1">Klik "Pesan Laundry" untuk mulai</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">No. Order</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Tanggal</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Pengiriman</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Total</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-mono font-semibold text-gray-900">{order.no_order}</td>
                      <td className="px-5 py-4 text-gray-600">{formatTanggal(order.tanggal_masuk)}</td>
                      <td className="px-5 py-4 text-xs text-gray-600">
                        {order.jenis_pengiriman === 'jemput' ? '🚗 Dijemput' : '🚶 Diantar'}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{formatRupiah(order.total_harga)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* WA Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-green-900">Ada pertanyaan atau butuh bantuan?</p>
            <p className="text-green-700 text-sm">Hubungi Mr. Clean langsung via WhatsApp</p>
          </div>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm whitespace-nowrap">
            <MessageCircle size={16} /> Chat WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
