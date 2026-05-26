'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile, logoutUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import { LogOut, Home, Printer, TrendingUp, Package, DollarSign, ArrowLeft } from 'lucide-react'

interface Order {
  id: number
  no_order: string
  tanggal_masuk: string
  total_harga: number
  bagi_hasil_nominal: number
  pendapatan_bersih: number
  status: string
  pelanggan: { nama: string } | null
}

type Periode = 'harian' | 'mingguan' | 'bulanan'

function getDateRange(periode: Periode, offset: number = 0) {
  const now = new Date()
  let start: Date, end: Date, label: string

  if (periode === 'harian') {
    start = new Date(now)
    start.setDate(start.getDate() - offset)
    start.setHours(0, 0, 0, 0)
    end = new Date(start)
    end.setHours(23, 59, 59, 999)
    label = start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } else if (periode === 'mingguan') {
    const day = now.getDay()
    const diffToMonday = (day === 0 ? -6 : 1 - day) - offset * 7
    start = new Date(now)
    start.setDate(now.getDate() + diffToMonday)
    start.setHours(0, 0, 0, 0)
    end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    label = `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59, 999)
    label = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  return { start, end, label }
}

export default function LaporanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState<Periode>('bulanan')
  const [offset, setOffset] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [bagiHasilPersen, setBagiHasilPersen] = useState(0)
  const [fetching, setFetching] = useState(false)

  const { start, end, label } = getDateRange(periode, offset)

  const fetchOrders = async (s: Date, e: Date) => {
    setFetching(true)
    const { data } = await supabase
      .from('orders')
      .select('id, no_order, tanggal_masuk, total_harga, bagi_hasil_nominal, pendapatan_bersih, status, pelanggan:pelanggan_id(nama)')
      .gte('tanggal_masuk', s.toISOString())
      .lte('tanggal_masuk', e.toISOString())
      .in('status', ['selesai', 'diambil'])
      .order('tanggal_masuk', { ascending: false })
    if (data) setOrders(data as any)
    setFetching(false)
  }

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user) { router.push('/owner/login'); return }
      const profile = await getUserProfile(user.id)
      if (profile && profile.role !== 'owner') { router.push('/owner/login'); return }

      const { data: pg } = await supabase.from('pengaturan').select('nilai').eq('kunci', 'bagi_hasil_persen').single()
      if (pg) setBagiHasilPersen(Number(pg.nilai))

      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    if (!loading) {
      const { start, end } = getDateRange(periode, offset)
      fetchOrders(start, end)
    }
  }, [periode, offset, loading])

  // Hitung statistik
  const totalPendapatan = orders.reduce((s, o) => s + (o.total_harga || 0), 0)
  const totalBagiHasil = orders.reduce((s, o) => s + (o.bagi_hasil_nominal || 0), 0)
  const totalBersih = orders.reduce((s, o) => s + (o.pendapatan_bersih || 0), 0)
  const totalOrder = orders.length

  const handleCetakPDF = () => {
    const win = window.open('', '_blank')
    if (!win) return

    const rows = orders.map((o, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
        <td style="padding:6px 10px;border:1px solid #e2e8f0">${i + 1}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0">${new Date(o.tanggal_masuk).toLocaleDateString('id-ID')}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0">${o.no_order}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0">${o.pelanggan?.nama ?? '—'}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${formatRupiah(o.total_harga)}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;color:#dc2626">${formatRupiah(o.bagi_hasil_nominal)}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;color:#16a34a;font-weight:600">${formatRupiah(o.pendapatan_bersih)}</td>
      </tr>`).join('')

    win.document.write(`<!DOCTYPE html><html><head>
      <title>Laporan ${label}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 25px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 18px; color: #1d4ed8; font-weight: bold; }
        .header p { font-size: 11px; color: #64748b; margin-top: 2px; }
        .title { font-size: 14px; font-weight: bold; text-align: center; margin: 12px 0 4px; }
        .subtitle { text-align: center; color: #64748b; font-size: 12px; margin-bottom: 16px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
        .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
        .summary-box .val { font-size: 14px; font-weight: bold; color: #1d4ed8; }
        .summary-box .lbl { font-size: 10px; color: #64748b; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead tr { background: #1d4ed8; color: white; }
        thead th { padding: 8px 10px; text-align: left; }
        tfoot tr { background: #f1f5f9; font-weight: bold; }
        tfoot td { padding: 8px 10px; border: 1px solid #e2e8f0; }
        .footer { margin-top: 20px; display: flex; justify-content: space-between; }
        .ttd { text-align: center; width: 180px; }
        .ttd .line { border-bottom: 1px solid #333; margin: 50px 10px 5px; }
        .ttd p { font-size: 11px; }
        @media print { body { padding: 15px; } }
      </style>
    </head><body>
      <div class="header">
        <h1>MR. CLEAN ONE STOP LAUNDRY</h1>
        <p>Limbangan Wetan, Kec. Brebes, Kabupaten Brebes, Jawa Tengah | WA: 081902156350</p>
      </div>
      <div class="title">LAPORAN PENDAPATAN ${periode.toUpperCase()}</div>
      <div class="subtitle">Periode: ${label}</div>
      <div class="summary">
        <div class="summary-box"><div class="val">${totalOrder}</div><div class="lbl">Total Order</div></div>
        <div class="summary-box"><div class="val">${formatRupiah(totalPendapatan)}</div><div class="lbl">Total Pendapatan</div></div>
        <div class="summary-box"><div class="val" style="color:#dc2626">${formatRupiah(totalBagiHasil)}</div><div class="lbl">Bagi Hasil Pusat (${bagiHasilPersen}%)</div></div>
        <div class="summary-box"><div class="val" style="color:#16a34a">${formatRupiah(totalBersih)}</div><div class="lbl">Pendapatan Bersih Cabang</div></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>No</th><th>Tanggal</th><th>No. Order</th><th>Pelanggan</th>
            <th style="text-align:right">Total</th>
            <th style="text-align:right">Bagi Hasil</th>
            <th style="text-align:right">Bersih</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="text-align:right">TOTAL</td>
            <td style="text-align:right">${formatRupiah(totalPendapatan)}</td>
            <td style="text-align:right;color:#dc2626">${formatRupiah(totalBagiHasil)}</td>
            <td style="text-align:right;color:#16a34a">${formatRupiah(totalBersih)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="footer">
        <div>
          <p style="font-size:11px;color:#64748b">Dicetak: ${new Date().toLocaleString('id-ID')}</p>
          <p style="font-size:11px;color:#64748b">Laporan ini digenerate otomatis oleh sistem Mr. Clean</p>
        </div>
        <div class="ttd">
          <div class="line"></div>
          <p>Owner Mr. Clean Brebes</p>
        </div>
      </div>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/owner/dashboard" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </Link>
            <img src="/logo_mrclean.png" alt="Mr. Clean" className="h-9 w-auto" />
            <div>
              <p className="font-bold text-gray-900 leading-none">Laporan Pendapatan</p>
              <p className="text-xs text-gray-500 mt-0.5">Rekap harian, mingguan, bulanan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCetakPDF}
              className="flex items-center gap-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition">
              <Printer size={15} /> Cetak PDF
            </button>
            <button onClick={() => { logoutUser(); router.push('/') }}
              className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition">
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter Periode */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['harian', 'mingguan', 'bulanan'] as Periode[]).map(p => (
              <button key={p} onClick={() => { setPeriode(p); setOffset(0) }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${periode === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {p}
              </button>
            ))}
          </div>
          {/* Navigasi periode */}
          <div className="flex items-center gap-3">
            <button onClick={() => setOffset(o => o + 1)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">← Sebelumnya</button>
            <span className="text-sm font-semibold text-gray-700 min-w-48 text-center">{label}</span>
            <button onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-40">Berikutnya →</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 p-1.5 rounded-lg"><Package className="text-blue-600" size={18} /></div>
              <p className="text-xs text-gray-500">Total Order</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalOrder}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-100 p-1.5 rounded-lg"><DollarSign className="text-green-600" size={18} /></div>
              <p className="text-xs text-gray-500">Total Pendapatan</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatRupiah(totalPendapatan)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-red-100 p-1.5 rounded-lg"><TrendingUp className="text-red-500" size={18} /></div>
              <p className="text-xs text-gray-500">Bagi Hasil Pusat ({bagiHasilPersen}%)</p>
            </div>
            <p className="text-xl font-bold text-red-600">- {formatRupiah(totalBagiHasil)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-green-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-100 p-1.5 rounded-lg"><DollarSign className="text-green-700" size={18} /></div>
              <p className="text-xs text-gray-500">Pendapatan Bersih</p>
            </div>
            <p className="text-xl font-bold text-green-700">{formatRupiah(totalBersih)}</p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Detail Order — {label}</h3>
            <span className="text-sm text-gray-500">{fetching ? 'Memuat...' : `${totalOrder} order selesai`}</span>
          </div>
          {orders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-4xl mb-3">📊</p>
              <p className="text-gray-500 font-medium">Tidak ada order selesai pada periode ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Tanggal</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">No. Order</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Pelanggan</th>
                    <th className="px-5 py-3 text-right font-semibold text-gray-600">Total</th>
                    <th className="px-5 py-3 text-right font-semibold text-gray-600">Bagi Hasil</th>
                    <th className="px-5 py-3 text-right font-semibold text-gray-600">Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-3 text-gray-600 text-xs">{new Date(o.tanggal_masuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-5 py-3 font-mono text-gray-900 text-xs">{o.no_order}</td>
                      <td className="px-5 py-3 text-gray-700">{o.pelanggan?.nama ?? '—'}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatRupiah(o.total_harga)}</td>
                      <td className="px-5 py-3 text-right text-red-500">- {formatRupiah(o.bagi_hasil_nominal)}</td>
                      <td className="px-5 py-3 text-right font-bold text-green-700">{formatRupiah(o.pendapatan_bersih)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 font-bold text-gray-700">TOTAL</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{formatRupiah(totalPendapatan)}</td>
                    <td className="px-5 py-3 text-right font-bold text-red-600">- {formatRupiah(totalBagiHasil)}</td>
                    <td className="px-5 py-3 text-right font-bold text-green-700">{formatRupiah(totalBersih)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
