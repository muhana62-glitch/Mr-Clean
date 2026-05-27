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
  tipe: string
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

  // Ganti password
  const [showGantiPass, setShowGantiPass] = useState(false)
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [gantiPassLoading, setGantiPassLoading] = useState(false)
  const [gantiPassError, setGantiPassError] = useState('')

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
        .from('jenis_cucian').select('id, nama, kategori, harga_kiloan, harga_satuan, satuan, tipe')
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

  const handleDownloadInvoice = async (order: Order) => {
    // Ambil detail order
    const { data: details } = await supabase
      .from('order_detail')
      .select('nama_item, kuantitas, kategori, harga_satuan, subtotal')
      .eq('order_id', order.id)

    const win = window.open('', '_blank')
    if (!win) return

    const itemRows = (details ?? []).map((d: any) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #ddd">${d.nama_item}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${d.kuantitas} ${d.kategori === 'kiloan' ? 'kg' : 'pcs'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">Rp ${Number(d.harga_satuan).toLocaleString('id-ID')}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">Rp ${Number(d.subtotal).toLocaleString('id-ID')}</td>
      </tr>`).join('')

    win.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice ${order.no_order}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; padding: 30px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1d4ed8; padding-bottom: 15px; }
        .header h1 { font-size: 20px; color: #1d4ed8; font-weight: bold; }
        .header p { font-size: 11px; color: #666; margin-top: 3px; }
        .invoice-title { font-size: 16px; font-weight: bold; text-align: center; margin: 15px 0; color: #1d4ed8; letter-spacing: 2px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
        .info-box h4 { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
        .info-box p { font-size: 13px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        thead tr { background: #1d4ed8; color: white; }
        thead th { padding: 8px; text-align: left; font-size: 12px; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .total-box { margin-left: auto; width: 260px; border: 2px solid #1d4ed8; border-radius: 8px; padding: 12px; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
        .total-row.final { border-top: 2px solid #1d4ed8; padding-top: 8px; font-weight: bold; font-size: 15px; color: #1d4ed8; }
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        @media print { body { padding: 15px; } }
      </style>
    </head><body>
      <div class="header">
        <h1>MR. CLEAN ONE STOP LAUNDRY</h1>
        <p>Limbangan Wetan, Kec. Brebes, Kabupaten Brebes, Jawa Tengah</p>
        <p>WhatsApp: 081902156350</p>
      </div>
      <div class="invoice-title">INVOICE</div>
      <div class="info-grid">
        <div class="info-box">
          <h4>Pelanggan</h4>
          <p>${userName}</p>
        </div>
        <div class="info-box">
          <h4>Detail Invoice</h4>
          <p>No. Order: ${order.no_order}</p>
          <span style="font-size:12px;color:#475569">Tanggal: ${formatTanggal(order.tanggal_masuk)}</span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="padding:8px">Item Cucian</th>
            <th style="padding:8px;text-align:center">Qty</th>
            <th style="padding:8px;text-align:right">Harga Satuan</th>
            <th style="padding:8px;text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div class="total-box">
        <div class="total-row final">
          <span>TOTAL BAYAR</span>
          <span>Rp ${Number(order.total_harga).toLocaleString('id-ID')}</span>
        </div>
      </div>
      <div class="footer">
        <p>Terima kasih telah menggunakan layanan Mr. Clean One Stop Laundry 🙏</p>
      </div>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  const handleGantiPassword = async () => {
    setGantiPassError('')
    if (newPass !== confirmPass) { setGantiPassError('Password baru tidak cocok.'); return }
    if (newPass.length < 6) { setGantiPassError('Password minimal 6 karakter.'); return }
    setGantiPassLoading(true)
    try {
      // Re-login dulu untuk verifikasi password lama
      const user = await getCurrentUser()
      if (!user?.email) throw new Error('Session tidak valid.')
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email, password: oldPass
      })
      if (signInErr) throw new Error('Password lama salah.')
      // Update password
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPass })
      if (updateErr) throw updateErr
      setSuccessMsg('Password berhasil diubah.')
      setShowGantiPass(false)
      setOldPass(''); setNewPass(''); setConfirmPass('')
    } catch (err: any) {
      setGantiPassError(err.message)
    } finally {
      setGantiPassLoading(false)
    }
  }

  // Toggle item di form pesan
  const toggleItem = (jc: JenisCucian) => {
    const existing = items.find(i => i.jenis_id === String(jc.id))
    if (existing) {
      setItems(items.filter(i => i.jenis_id !== String(jc.id)))
    } else {
      // Pakai kolom tipe dari database
      const isKiloan = jc.tipe === 'kiloan'
      const harga = isKiloan ? (jc.harga_kiloan ?? 0) : (jc.harga_satuan ?? 0)
      const kategori_harga: 'kiloan' | 'satuan' = isKiloan ? 'kiloan' : 'satuan'
      const kuantitas = isKiloan ? 0 : 1
      setItems([...items, {
        jenis_id: String(jc.id),
        nama: jc.nama,
        kategori_harga,
        kuantitas,
        harga,
        subtotal: harga * kuantitas,
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
            <img src="/logo_mrclean.png" alt="Mr. Clean" className="h-9 w-auto" />
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
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="bg-blue-100 p-2 rounded-lg mb-1"><Package className="text-blue-600" size={18} /></div>
              <p className="text-xs text-gray-500 leading-tight">Total Cucian</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="bg-yellow-100 p-2 rounded-lg mb-1"><Clock className="text-yellow-600" size={18} /></div>
              <p className="text-xs text-gray-500 leading-tight">Diproses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.aktif}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="bg-green-100 p-2 rounded-lg mb-1"><CheckCircle className="text-green-600" size={18} /></div>
              <p className="text-xs text-gray-500 leading-tight">Selesai</p>
              <p className="text-2xl font-bold text-gray-900">{stats.selesai}</p>
            </div>
          </div>
        </div>

        {/* Tombol Pesan + WA */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <button onClick={() => { setShowForm(true); setSuccessMsg('') }}
            className="flex flex-col items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition text-xs">
            <Plus size={18} />
            <span>Pesan Laundry</span>
          </button>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition text-xs">
            <MessageCircle size={18} />
            <span>WhatsApp</span>
          </a>
          <button onClick={() => setShowGantiPass(true)}
            className="flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition text-xs">
            <span className="text-base">🔑</span>
            <span>Password</span>
          </button>
        </div>

        {/* Modal Ganti Password */}
        {showGantiPass && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Ganti Password</h3>
                <button onClick={() => { setShowGantiPass(false); setGantiPassError('') }}
                  className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              {gantiPassError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">{gantiPassError}</div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
                  <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowGantiPass(false); setGantiPassError('') }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                  Batal
                </button>
                <button onClick={handleGantiPassword} disabled={gantiPassLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                  {gantiPassLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                          {jc.tipe === 'kiloan' ? 'Per kilogram ⚖️' : `Per ${jc.satuan}`}
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
                          <p className="text-xs text-gray-500">
                            {item.kategori_harga === 'kiloan'
                              ? '⚖️ Berat ditimbang karyawan'
                              : `Per pcs`}
                          </p>
                        </div>
                        {item.kategori_harga === 'satuan' ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateKuantitas(item.jenis_id, Math.max(1, item.kuantitas - 1))}
                              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700 transition">−</button>
                            <span className="w-8 text-center text-sm font-semibold">{item.kuantitas}</span>
                            <button onClick={() => updateKuantitas(item.jenis_id, item.kuantitas + 1)}
                              className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center font-bold text-green-700 transition">+</button>
                            <span className="text-xs text-gray-500">pcs</span>
                          </div>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg font-medium">Ditimbang</span>
                        )}
                        <button onClick={() => setItems(items.filter(i => i.jenis_id !== item.jenis_id))}
                          className="text-red-400 hover:text-red-600"><X size={15} /></button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">* Harga akan dikonfirmasi setelah cucian diterima dan ditimbang oleh karyawan</p>
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
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Invoice</th>
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
                      <td className="px-5 py-4">
                        {['selesai', 'diambil'].includes(order.status) && order.total_harga > 0 ? (
                          <button
                            onClick={() => handleDownloadInvoice(order)}
                            className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg transition font-medium"
                          >
                            📄 Invoice
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
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
