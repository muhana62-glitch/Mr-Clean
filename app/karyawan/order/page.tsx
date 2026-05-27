'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile, logoutUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatTanggal, generateNoOrder } from '@/lib/utils'
import { Search, Plus, X, Save, Printer, Home, LogOut, User, Phone, MapPin } from 'lucide-react'

interface Pelanggan {
  id: number
  nama: string
  no_wa: string
  alamat: string | null
  total_order: number
}

interface JenisCucian {
  id: number
  nama: string
  harga_kiloan: number | null
  harga_satuan: number | null
  satuan: string
}

interface OrderItem {
  jenis_id: string
  nama_item: string
  kategori: 'kiloan' | 'satuan'
  kuantitas: number
  harga_satuan: number
  subtotal: number
}

export default function InputOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [karyawanId, setKaryawanId] = useState<number | null>(null)
  const [jenisCucian, setJenisCucian] = useState<JenisCucian[]>([])
  const [bagiHasilPersen, setBagiHasilPersen] = useState(0)

  // Pelanggan
  const [searchPelanggan, setSearchPelanggan] = useState('')
  const [pelangganResults, setPelangganResults] = useState<Pelanggan[]>([])
  const [selectedPelanggan, setSelectedPelanggan] = useState<Pelanggan | null>(null)
  const [showNewPelanggan, setShowNewPelanggan] = useState(false)
  const [newNama, setNewNama] = useState('')
  const [newNoWa, setNewNoWa] = useState('')
  const [newAlamat, setNewAlamat] = useState('')

  // Order
  const [jenisPengiriman, setJenisPengiriman] = useState<'antar' | 'jemput'>('antar')
  const [catatan, setCatatan] = useState('')
  const [items, setItems] = useState<OrderItem[]>([
    { jenis_id: '', nama_item: '', kategori: 'kiloan', kuantitas: 1, harga_satuan: 0, subtotal: 0 }
  ])

  // State
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedOrder, setSavedOrder] = useState<any>(null)
  const slipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user) { router.push('/karyawan/login'); return }
      const profile = await getUserProfile(user.id)
      if (profile && profile.role !== 'karyawan') { router.push('/karyawan/login'); return }

      const { data: kar } = await supabase.from('karyawan').select('id').eq('user_id', user.id).single()
      if (kar) setKaryawanId(kar.id)

      const { data: jc } = await supabase.from('jenis_cucian').select('*').eq('is_active', true).order('nama')
      if (jc) setJenisCucian(jc as JenisCucian[])
      const { data: pg } = await supabase.from('pengaturan').select('nilai').eq('kunci', 'bagi_hasil_persen').single()
      if (pg) setBagiHasilPersen(Number(pg.nilai))

      setLoading(false)
    }
    init()
  }, [router])

  const searchPelangganDB = async (q: string) => {
    if (q.length < 2) { setPelangganResults([]); return }
    const { data } = await supabase.from('pelanggan').select('id, nama, no_wa, alamat')
      .or(`nama.ilike.%${q}%,no_wa.ilike.%${q}%`).limit(5)
    if (data) setPelangganResults(data as Pelanggan[])
  }

  const handleSelectPelanggan = (p: Pelanggan) => {
    setSelectedPelanggan(p)
    setSearchPelanggan(p.nama)
    setPelangganResults([])
    setShowNewPelanggan(false)
  }

  const handleSavePelangganBaru = async () => {
    if (!newNama || !newNoWa) { setError('Nama dan No. WA wajib diisi.'); return }
    const { data, error: err } = await supabase.from('pelanggan')
      .insert({ nama: newNama, no_wa: newNoWa, alamat: newAlamat || null })
      .select().single()
    if (err) { setError(err.message); return }
    setSelectedPelanggan(data as Pelanggan)
    setSearchPelanggan(newNama)
    setShowNewPelanggan(false)
    setNewNama(''); setNewNoWa(''); setNewAlamat('')
  }

  const updateItem = (i: number, field: string, value: any) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [field]: value }
      if (field === 'jenis_id') {
        const jc = jenisCucian.find(j => j.id === Number(value))
        if (jc) {
          updated.nama_item = jc.nama
          updated.harga_satuan = updated.kategori === 'kiloan' ? (jc.harga_kiloan ?? 0) : (jc.harga_satuan ?? 0)
          updated.subtotal = updated.harga_satuan * updated.kuantitas
        }
      }
      if (field === 'kategori') {
        const jc = jenisCucian.find(j => j.id === Number(updated.jenis_id))
        if (jc) {
          updated.harga_satuan = value === 'kiloan' ? (jc.harga_kiloan ?? 0) : (jc.harga_satuan ?? 0)
          updated.subtotal = updated.harga_satuan * updated.kuantitas
        }
      }
      if (field === 'kuantitas') {
        updated.subtotal = updated.harga_satuan * Number(value)
      }
      return updated
    }))
  }

  const addItem = () => setItems(prev => [...prev, { jenis_id: '', nama_item: '', kategori: 'kiloan', kuantitas: 1, harga_satuan: 0, subtotal: 0 }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const totalHarga = items.reduce((s, i) => s + i.subtotal, 0)
  const bagiHasilNominal = (totalHarga * bagiHasilPersen) / 100
  const pendapatanBersih = totalHarga - bagiHasilNominal

  const handleSimpan = async () => {
    setError('')
    if (!selectedPelanggan) { setError('Pilih atau tambah pelanggan dulu.'); return }
    if (items.some(i => !i.jenis_id || i.kuantitas <= 0)) { setError('Lengkapi semua item cucian.'); return }
    setSaving(true)
    try {
      const noOrder = generateNoOrder()
      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        no_order: noOrder,
        pelanggan_id: selectedPelanggan.id,
        karyawan_id: karyawanId,
        jenis_pengiriman: jenisPengiriman,
        total_harga: totalHarga,
        bagi_hasil_persen: bagiHasilPersen,
        bagi_hasil_nominal: bagiHasilNominal,
        pendapatan_bersih: pendapatanBersih,
        status: 'diterima',
        catatan: catatan || null,
      }).select().single()
      if (orderErr) throw orderErr

      const details = items.map(item => ({
        order_id: order.id,
        jenis_cucian_id: Number(item.jenis_id),
        nama_item: item.nama_item,
        kategori: item.kategori,
        kuantitas: item.kuantitas,
        harga_satuan: item.harga_satuan,
        subtotal: item.subtotal,
      }))
      await supabase.from('order_detail').insert(details)

      // Update total order pelanggan
      await supabase.from('pelanggan').update({ total_order: (selectedPelanggan.total_order ?? 0) + 1 }).eq('id', selectedPelanggan.id)

      setSavedOrder({ ...order, pelanggan: selectedPelanggan, items, bagiHasilPersen, bagiHasilNominal, pendapatanBersih })
    } catch (err: any) {
      setError(err.message ?? 'Gagal menyimpan order.')
    } finally {
      setSaving(false)
    }
  }

  const handlePrintSlip = () => {
    const printContent = document.getElementById('slip-order')
    if (!printContent) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Slip Order</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        h2 { text-align: center; margin: 0; font-size: 16px; }
        p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; font-size: 11px; }
        th { background: #f0f0f0; }
        .total { font-weight: bold; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #999; margin: 8px 0; }
      </style></head><body>`)
    win.document.write(printContent.innerHTML)
    win.document.write('</body></html>')
    win.document.close()
    win.print()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>

  // Tampilkan slip setelah order tersimpan
  if (savedOrder) return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-green-700 text-lg">✅ Order Tersimpan</h2>
            <Link href="/karyawan/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
          </div>
          <button onClick={handlePrintSlip}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition mb-3">
            <Printer size={18} /> Cetak Slip Order
          </button>
          <button onClick={() => { setSavedOrder(null); setSelectedPelanggan(null); setSearchPelanggan(''); setItems([{ jenis_id: '', nama_item: '', kategori: 'kiloan', kuantitas: 1, harga_satuan: 0, subtotal: 0 }]); setCatatan('') }}
            className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
            Input Order Baru
          </button>
        </div>

        {/* Slip Order untuk print */}
        <div id="slip-order" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2>MR. CLEAN ONE STOP LAUNDRY</h2>
          <p className="center" style={{textAlign:'center', fontSize:'11px', color:'#666'}}>Limbangan Wetan, Kec. Brebes, Kab. Brebes, Jawa Tengah</p>
          <p className="center" style={{textAlign:'center', fontSize:'11px', color:'#666'}}>WA: 081902156350</p>
          <div className="divider" style={{borderTop:'1px dashed #999', margin:'8px 0'}}></div>
          <p><strong>SLIP ORDER</strong></p>
          <p>No. Order: <strong>{savedOrder.no_order}</strong></p>
          <p>Tanggal: {new Date(savedOrder.tanggal_masuk).toLocaleString('id-ID')}</p>
          <div className="divider" style={{borderTop:'1px dashed #999', margin:'8px 0'}}></div>
          <p><strong>Data Pelanggan:</strong></p>
          <p>Nama: {savedOrder.pelanggan.nama}</p>
          <p>No. WA: {savedOrder.pelanggan.no_wa}</p>
          {savedOrder.pelanggan.alamat && <p>Alamat: {savedOrder.pelanggan.alamat}</p>}
          <p>Pengiriman: {savedOrder.jenis_pengiriman === 'antar' ? 'Diantar ke Mr. Clean' : 'Dijemput oleh Mr. Clean'}</p>
          <div className="divider" style={{borderTop:'1px dashed #999', margin:'8px 0'}}></div>
          <table>
            <thead><tr><th>Item</th><th>Kat.</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
            <tbody>
              {savedOrder.items.map((item: OrderItem, i: number) => (
                <tr key={i}>
                  <td>{item.nama_item}</td>
                  <td>{item.kategori}</td>
                  <td>{item.kuantitas} {item.kategori === 'kiloan' ? 'kg' : 'pcs'}</td>
                  <td>{formatRupiah(item.harga_satuan)}</td>
                  <td>{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="divider" style={{borderTop:'1px dashed #999', margin:'8px 0'}}></div>
          <p className="total" style={{fontWeight:'bold'}}>TOTAL: {formatRupiah(savedOrder.total_harga)}</p>
          {savedOrder.catatan && <p>Catatan: {savedOrder.catatan}</p>}
          <div className="divider" style={{borderTop:'1px dashed #999', margin:'8px 0'}}></div>
          <p style={{fontSize:'10px', textAlign:'center', color:'#888'}}>Simpan slip ini sebagai bukti penerimaan cucian.</p>
          <p style={{fontSize:'10px', textAlign:'center', color:'#888'}}>Invoice akan diberikan saat cucian selesai.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧺</span>
            <div>
              <p className="font-bold text-gray-900 leading-none">Input Order Baru</p>
              <p className="text-xs text-gray-500 mt-0.5">Portal Karyawan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/karyawan/dashboard" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
              <Home size={16} /> Dashboard
            </Link>
            <button onClick={() => { logoutUser(); router.push('/') }}
              className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition">
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

        {/* Step 1: Pelanggan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><User size={18} className="text-blue-600" /> 1. Data Pelanggan</h3>
          {selectedPelanggan ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between">
              <div>
                <p className="font-semibold text-blue-900">{selectedPelanggan.nama}</p>
                <p className="text-sm text-blue-700 flex items-center gap-1 mt-1"><Phone size={13} /> {selectedPelanggan.no_wa}</p>
                {selectedPelanggan.alamat && <p className="text-sm text-blue-600 flex items-center gap-1 mt-0.5"><MapPin size={13} /> {selectedPelanggan.alamat}</p>}
              </div>
              <button onClick={() => { setSelectedPelanggan(null); setSearchPelanggan('') }} className="text-blue-400 hover:text-blue-600"><X size={18} /></button>
            </div>
          ) : (
            <div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={searchPelanggan} onChange={e => { setSearchPelanggan(e.target.value); searchPelangganDB(e.target.value) }}
                  placeholder="Cari nama atau no. WA pelanggan..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {pelangganResults.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                  {pelangganResults.map(p => (
                    <button key={p.id} onClick={() => handleSelectPelanggan(p)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition border-b border-gray-100 last:border-0">
                      <p className="font-medium text-gray-900 text-sm">{p.nama}</p>
                      <p className="text-xs text-gray-500">{p.no_wa} {p.alamat ? `• ${p.alamat}` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setShowNewPelanggan(!showNewPelanggan)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                <Plus size={15} /> Pelanggan baru
              </button>
              {showNewPelanggan && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <input type="text" value={newNama} onChange={e => setNewNama(e.target.value)} placeholder="Nama lengkap *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="tel" value={newNoWa} onChange={e => setNewNoWa(e.target.value)} placeholder="No. WhatsApp *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" value={newAlamat} onChange={e => setNewAlamat(e.target.value)} placeholder="Alamat (opsional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleSavePelangganBaru}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                    Simpan & Pilih Pelanggan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Jenis Pengiriman */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">2. Jenis Pengiriman</h3>
          <div className="flex gap-3">
            {(['antar', 'jemput'] as const).map(j => (
              <button key={j} onClick={() => setJenisPengiriman(j)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition ${jenisPengiriman === j ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {j === 'antar' ? '🚶 Diantar ke Mr. Clean' : '🚗 Dijemput oleh Mr. Clean'}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Item Cucian */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">3. Item Cucian</h3>
            <button onClick={addItem} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
              <Plus size={15} /> Tambah Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <select value={item.jenis_id} onChange={e => updateItem(i, 'jenis_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih item...</option>
                    {jenisCucian.map(jc => <option key={jc.id} value={jc.id}>{jc.nama}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <select value={item.kategori} onChange={e => updateItem(i, 'kategori', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="kiloan">Kiloan</option>
                    <option value="satuan">Satuan</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" value={item.kuantitas} onChange={e => updateItem(i, 'kuantitas', Number(e.target.value))}
                    min={0.1} step={0.1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2 text-right text-sm font-semibold text-gray-700">
                  {item.subtotal > 0 ? formatRupiah(item.subtotal) : '—'}
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><X size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-gray-900 text-base">{formatRupiah(totalHarga)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Bagi hasil pusat ({bagiHasilPersen}%)</span>
              <span>- {formatRupiah(bagiHasilNominal)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-green-700 mt-1">
              <span>Pendapatan bersih cabang</span>
              <span>{formatRupiah(pendapatanBersih)}</span>
            </div>
          </div>
        </div>

        {/* Catatan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-3">4. Catatan (opsional)</h3>
          <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
            placeholder="Catatan khusus untuk order ini..."
            rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <button onClick={handleSimpan} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-base">
          <Save size={20} /> {saving ? 'Menyimpan...' : 'Simpan & Cetak Slip Order'}
        </button>
      </div>
    </div>
  )
}
