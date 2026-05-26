'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatTanggal, getStatusLabel, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Save, FileText, Printer } from 'lucide-react'

interface OrderDetail {
  id: number
  nama_item: string
  kategori: string
  kuantitas: number
  harga_satuan: number
  subtotal: number
  catatan: string | null
}

interface Order {
  id: number
  no_order: string
  tanggal_masuk: string
  status: string
  jenis_pengiriman: string | null
  catatan: string | null
  total_harga: number
  bagi_hasil_persen: number
  bagi_hasil_nominal: number
  pendapatan_bersih: number
  pelanggan: {
    nama: string
    no_wa: string
    alamat: string | null
  } | null
}

export default function DetailOrderPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [details, setDetails] = useState<OrderDetail[]>([])
  const [editedHarga, setEditedHarga] = useState<Record<number, string>>({})
  const [bagiHasilPersen, setBagiHasilPersen] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user) { router.push('/karyawan/login'); return }
      const profile = await getUserProfile(user.id)
      if (profile && profile.role !== 'karyawan') { router.push('/karyawan/login'); return }

      // Fetch order
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, no_order, tanggal_masuk, status, jenis_pengiriman, catatan, total_harga, bagi_hasil_persen, bagi_hasil_nominal, pendapatan_bersih, pelanggan:pelanggan_id(nama, no_wa, alamat)')
        .eq('id', orderId)
        .single()

      if (orderData) setOrder(orderData as any)

      // Fetch detail
      const { data: detailData } = await supabase
        .from('order_detail')
        .select('id, nama_item, kategori, kuantitas, harga_satuan, subtotal, catatan')
        .eq('order_id', orderId)

      if (detailData) {
        setDetails(detailData as OrderDetail[])
        // Init harga sebagai string agar bisa diedit bebas
        const hargaMap: Record<number, string> = {}
        detailData.forEach((d: any) => { hargaMap[d.id] = d.harga_satuan > 0 ? String(d.harga_satuan) : '' })
        setEditedHarga(hargaMap)
      }

      // Ambil % bagi hasil
      const { data: pg } = await supabase.from('pengaturan').select('nilai').eq('kunci', 'bagi_hasil_persen').single()
      if (pg) setBagiHasilPersen(Number(pg.nilai))

      setLoading(false)
    }
    init()
  }, [orderId, router])

  const updateHarga = (detailId: number, val: string) => {
    setEditedHarga(prev => ({ ...prev, [detailId]: val }))
  }

  const hitungTotal = () => {
    return details.reduce((sum, d) => {
      const harga = Number(editedHarga[d.id] ?? d.harga_satuan) || 0
      return sum + harga * d.kuantitas
    }, 0)
  }

  const totalHarga = hitungTotal()
  const bagiHasilNominal = (totalHarga * bagiHasilPersen) / 100
  const pendapatanBersih = totalHarga - bagiHasilNominal

  const handleSimpanHarga = async () => {
    setSaving(true); setError('')
    try {
      // Update setiap detail
      for (const d of details) {
        const harga = Number(editedHarga[d.id]) || 0
        const subtotal = harga * d.kuantitas
        await supabase.from('order_detail').update({
          harga_satuan: harga,
          subtotal,
        }).eq('id', d.id)
      }

      // Update order total
      await supabase.from('orders').update({
        total_harga: totalHarga,
        bagi_hasil_persen: bagiHasilPersen,
        bagi_hasil_nominal: bagiHasilNominal,
        pendapatan_bersih: pendapatanBersih,
        status: 'selesai',
        tanggal_selesai: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', orderId)

      // Refresh data
      const { data: updatedDetails } = await supabase
        .from('order_detail').select('*').eq('order_id', orderId)
      if (updatedDetails) {
        setDetails(updatedDetails as OrderDetail[])
        const hargaMap: Record<number, string> = {}
        updatedDetails.forEach((d: any) => { hargaMap[d.id] = String(d.harga_satuan) })
        setEditedHarga(hargaMap)
      }

      const { data: updatedOrder } = await supabase
        .from('orders').select('*').eq('id', orderId).single()
      if (updatedOrder) setOrder(updatedOrder as any)

      setSaved(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCetakInvoice = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const tgl = order ? formatTanggal(order.tanggal_masuk) : ''
    const itemRows = details.map(d => {
      const harga = Number(editedHarga[d.id] ?? d.harga_satuan) || 0
      const subtotal = harga * d.kuantitas
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #ddd">${d.nama_item}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${d.kuantitas} ${d.kategori === 'kiloan' ? 'kg' : 'pcs'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${formatRupiah(harga)}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${formatRupiah(subtotal)}</td>
      </tr>`
    }).join('')

    win.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice ${order?.no_order}</title>
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
        .info-box p { font-size: 13px; font-weight: 600; color: #1e293b; }
        .info-box span { font-size: 12px; color: #475569; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        thead tr { background: #1d4ed8; color: white; }
        thead th { padding: 8px; text-align: left; font-size: 12px; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .total-section { margin-left: auto; width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
        .total-row.final { border-top: 2px solid #1d4ed8; padding-top: 8px; font-weight: bold; font-size: 15px; color: #1d4ed8; }
        .bagi-hasil { color: #dc2626; }
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        .ttd { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
        .ttd-box { text-align: center; }
        .ttd-box .line { border-bottom: 1px solid #333; margin: 40px 20px 5px; }
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
          <h4>Data Pelanggan</h4>
          <p>${order?.pelanggan?.nama ?? '-'}</p>
          <span>WA: ${order?.pelanggan?.no_wa ?? '-'}</span><br/>
          ${order?.pelanggan?.alamat ? `<span>${order.pelanggan.alamat}</span>` : ''}
        </div>
        <div class="info-box">
          <h4>Detail Invoice</h4>
          <p>No. Order: ${order?.no_order}</p>
          <span>Tanggal: ${tgl}</span><br/>
          <span>Pengiriman: ${order?.jenis_pengiriman === 'jemput' ? 'Dijemput' : 'Diantar'}</span>
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
      <div class="total-section">
        <div class="total-row"><span>Total Kotor</span><span>${formatRupiah(totalHarga)}</span></div>
        <div class="total-row bagi-hasil"><span>Bagi Hasil Pusat (${bagiHasilPersen}%)</span><span>- ${formatRupiah(bagiHasilNominal)}</span></div>
        <div class="total-row final"><span>TOTAL BAYAR</span><span>${formatRupiah(totalHarga)}</span></div>
      </div>
      ${order?.catatan ? `<p style="margin-top:15px;font-size:12px;color:#64748b">Catatan: ${order.catatan}</p>` : ''}
      <div class="ttd">
        <div class="ttd-box"><div class="line"></div><p>Pelanggan</p><p style="font-size:11px;color:#94a3b8">(${order?.pelanggan?.nama ?? ''})</p></div>
        <div class="ttd-box"><div class="line"></div><p>Petugas Mr. Clean</p></div>
      </div>
      <div class="footer">
        <p>Terima kasih telah menggunakan layanan Mr. Clean One Stop Laundry</p>
        <p>Invoice ini digenerate secara otomatis oleh sistem</p>
      </div>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Order tidak ditemukan.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/karyawan/dashboard" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <p className="font-bold text-gray-900 leading-none">Detail Order</p>
              <p className="text-xs text-gray-500 mt-0.5">{order.no_order}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium">
            ✅ Harga tersimpan dan status diubah ke Selesai. Silakan cetak invoice.
          </div>
        )}

        {/* Info Order */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Informasi Order</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Pelanggan</p><p className="font-semibold text-gray-900">{order.pelanggan?.nama ?? '—'}</p></div>
            <div><p className="text-gray-500">No. WhatsApp</p><p className="font-semibold text-gray-900">{order.pelanggan?.no_wa ?? '—'}</p></div>
            <div><p className="text-gray-500">Tanggal Masuk</p><p className="font-semibold text-gray-900">{formatTanggal(order.tanggal_masuk)}</p></div>
            <div><p className="text-gray-500">Pengiriman</p><p className="font-semibold text-gray-900">{order.jenis_pengiriman === 'jemput' ? '🚗 Dijemput' : '🚶 Diantar'}</p></div>
            {order.catatan && <div className="col-span-2"><p className="text-gray-500">Catatan</p><p className="font-semibold text-gray-900">{order.catatan}</p></div>}
          </div>
        </div>

        {/* Input Harga per Item */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-2">Input Harga dari Pusat</h3>
          <p className="text-sm text-gray-500 mb-4">Masukkan harga per item sesuai yang ditentukan oleh pusat.</p>

          <div className="space-y-3">
            {details.map(d => (
              <div key={d.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{d.nama_item}</p>
                  <p className="text-xs text-gray-500">{d.kuantitas} {d.kategori === 'kiloan' ? 'kg' : 'pcs'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editedHarga[d.id] ?? ''}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      updateHarga(d.id, val)
                    }}
                    className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-500">/{d.kategori === 'kiloan' ? 'kg' : 'pcs'}</span>
                </div>
                <div className="w-24 text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {formatRupiah((Number(editedHarga[d.id]) || 0) * d.kuantitas)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Ringkasan */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Kotor</span>
              <span className="font-semibold text-gray-900">{formatRupiah(totalHarga)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bagi Hasil Pusat ({bagiHasilPersen}%)</span>
              <span className="text-red-500">- {formatRupiah(bagiHasilNominal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-green-700 pt-1 border-t border-gray-100">
              <span>Pendapatan Bersih Cabang</span>
              <span>{formatRupiah(pendapatanBersih)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-blue-700 pt-2 border-t-2 border-blue-100">
              <span>Total Tagihan Pelanggan</span>
              <span>{formatRupiah(totalHarga)}</span>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex gap-3">
          <button
            onClick={handleSimpanHarga}
            disabled={saving || order.status === 'diambil'}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition"
          >
            <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Harga & Selesaikan'}
          </button>
          <button
            onClick={handleCetakInvoice}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
          >
            <Printer size={18} /> Cetak Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
