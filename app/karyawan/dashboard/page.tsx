'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile, logoutUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatTanggal, getStatusLabel, getStatusColor, generateNoOrder } from '@/lib/utils'
import {
  LogOut, Home, Plus, RefreshCw, Package, Clock, CheckCircle, X,
  ChevronDown, Save, Search,
} from 'lucide-react'

interface Order {
  id: number
  no_order: string
  tanggal_masuk: string
  total_harga: number
  status: string
  catatan: string | null
  pelanggan: { users: { nama: string; no_hp: string } } | null
}

interface JenisCucian {
  id: number
  nama: string
  harga_kiloan: number | null
  harga_satuan: number | null
}

const STATUS_OPTIONS = ['diterima', 'diproses', 'selesai', 'diambil', 'dibatalkan']

export default function KaryawanDashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [jenisCucian, setJenisCucian] = useState<JenisCucian[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')

  // Modal tambah order
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Form state
  const [namaPelanggan, setNamaPelanggan] = useState('')
  const [noHp, setNoHp] = useState('')
  const [catatan, setCatatan] = useState('')
  const [items, setItems] = useState([{ jenis_id: '', kategori: 'kiloan', kuantitas: 1 }])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id, no_order, tanggal_masuk, total_harga, status, catatan,
        pelanggan:pelanggan_id (
          users:user_id ( nama, no_hp )
        )
      `)
      .order('tanggal_masuk', { ascending: false })
      .limit(100)
    if (data) setOrders(data as any)
  }

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user) { router.push('/karyawan/login'); return }
      const profile = await getUserProfile(user.id)
      // Kalau profile null tapi user ada, tetap lanjut (RLS mungkin ketat)
      if (profile && profile.role !== 'karyawan') { router.push('/karyawan/login'); return }
      setUserName(profile?.nama ?? 'Karyawan')

      await fetchOrders()

      const { data: jc } = await supabase.from('jenis_cucian').select('*').eq('is_active', true)
      if (jc) setJenisCucian(jc as JenisCucian[])

      setLoading(false)
    }
    init()
  }, [router])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  const addItem = () => setItems([...items, { jenis_id: '', kategori: 'kiloan', kuantitas: 1 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: any) => {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const hitungTotal = () => {
    return items.reduce((total, item) => {
      const jc = jenisCucian.find((j) => j.id === Number(item.jenis_id))
      if (!jc) return total
      const harga = item.kategori === 'kiloan' ? (jc.harga_kiloan ?? 0) : (jc.harga_satuan ?? 0)
      return total + harga * item.kuantitas
    }, 0)
  }

  const handleTambahOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (items.some((i) => !i.jenis_id)) {
      setFormError('Pilih jenis cucian untuk semua item.')
      return
    }
    setSaving(true)
    try {
      // Cari atau buat pelanggan
      let pelangganId: number

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('no_hp', noHp)
        .single()

      if (existingUser) {
        const { data: existingPelanggan } = await supabase
          .from('pelanggan')
          .select('id')
          .eq('user_id', existingUser.id)
          .single()
        pelangganId = existingPelanggan!.id
      } else {
        // Buat guest pelanggan tanpa auth
        const { data: newPelanggan, error: pelErr } = await supabase
          .from('pelanggan')
          .insert({ total_order: 0, total_pengeluaran: 0 })
          .select('id')
          .single()
        if (pelErr) throw pelErr
        pelangganId = newPelanggan.id
      }

      const noOrder = generateNoOrder()
      const totalHarga = hitungTotal()

      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          no_order: noOrder,
          pelanggan_id: pelangganId,
          total_harga: totalHarga,
          status: 'diterima',
          catatan: catatan || null,
        })
        .select('id')
        .single()
      if (orderErr) throw orderErr

      // Insert order detail
      const details = items.map((item) => {
        const jc = jenisCucian.find((j) => j.id === Number(item.jenis_id))!
        const harga = item.kategori === 'kiloan' ? (jc.harga_kiloan ?? 0) : (jc.harga_satuan ?? 0)
        return {
          order_id: newOrder.id,
          jenis_cucian_id: Number(item.jenis_id),
          kategori: item.kategori,
          kuantitas: item.kuantitas,
          harga_satuan: harga,
          subtotal: harga * item.kuantitas,
        }
      })
      await supabase.from('order_detail').insert(details)

      // Reset form
      setShowModal(false)
      setNamaPelanggan('')
      setNoHp('')
      setCatatan('')
      setItems([{ jenis_id: '', kategori: 'kiloan', kuantitas: 1 }])
      await fetchOrders()
    } catch (err: any) {
      setFormError(err.message ?? 'Gagal menyimpan order.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch = search === '' ||
      o.no_order.toLowerCase().includes(search.toLowerCase()) ||
      (o.pelanggan?.users?.nama ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'semua' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: orders.length,
    aktif: orders.filter((o) => ['diterima', 'diproses'].includes(o.status)).length,
    selesai: orders.filter((o) => o.status === 'selesai').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
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
            <span className="text-2xl">🧺</span>
            <div>
              <p className="font-bold text-gray-900 leading-none">Halo, {userName} 👷</p>
              <p className="text-xs text-gray-500 mt-0.5">Dashboard Karyawan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. order atau nama pelanggan..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="semua">Semua Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{getStatusLabel(s)}</option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition font-semibold"
          >
            <Plus size={16} /> Tambah Order
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">No. Order</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Pelanggan</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Tanggal</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Total</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      Tidak ada order ditemukan
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-mono font-semibold text-gray-900">{order.no_order}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{order.pelanggan?.users?.nama ?? 'Tamu'}</p>
                        <p className="text-xs text-gray-500">{order.pelanggan?.users?.no_hp ?? '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{formatTanggal(order.tanggal_masuk)}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{formatRupiah(order.total_harga)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className="appearance-none border border-gray-300 rounded-lg px-3 py-1.5 text-xs pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{getStatusLabel(s)}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
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

      {/* Modal Tambah Order */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Tambah Order Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTambahOrder} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggan</label>
                  <input
                    type="text"
                    value={namaPelanggan}
                    onChange={(e) => setNamaPelanggan(e.target.value)}
                    placeholder="Nama pelanggan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
                  <input
                    type="tel"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Item Cucian</label>
                  <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Plus size={12} /> Tambah Item
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        value={item.jenis_id}
                        onChange={(e) => updateItem(i, 'jenis_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Pilih jenis...</option>
                        {jenisCucian.map((jc) => (
                          <option key={jc.id} value={jc.id}>{jc.nama}</option>
                        ))}
                      </select>
                      <select
                        value={item.kategori}
                        onChange={(e) => updateItem(i, 'kategori', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="kiloan">Kiloan</option>
                        <option value="satuan">Satuan</option>
                      </select>
                      <input
                        type="number"
                        value={item.kuantitas}
                        onChange={(e) => updateItem(i, 'kuantitas', Number(e.target.value))}
                        min={0.1}
                        step={0.1}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan khusus..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Estimasi</span>
                <span className="font-bold text-blue-700 text-lg">{formatRupiah(hitungTotal())}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'Menyimpan...' : 'Simpan Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
