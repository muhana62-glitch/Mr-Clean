'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile, logoutUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import { Plus, Pencil, Trash2, Save, X, LogOut, Home, Settings, Package } from 'lucide-react'

interface JenisCucian {
  id: number
  nama: string
  deskripsi: string | null
  harga_kiloan: number | null
  harga_satuan: number | null
  satuan: string
  is_active: boolean
}

interface Pengaturan {
  kunci: string
  nilai: string
  keterangan: string | null
}

export default function MasterDataPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jenisList, setJenisList] = useState<JenisCucian[]>([])
  const [pengaturan, setPengaturan] = useState<Pengaturan[]>([])
  const [activeTab, setActiveTab] = useState<'jenis' | 'pengaturan'>('jenis')

  // Form jenis cucian
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formNama, setFormNama] = useState('')
  const [formDeskripsi, setFormDeskripsi] = useState('')
  const [formHargaKiloan, setFormHargaKiloan] = useState('')
  const [formHargaSatuan, setFormHargaSatuan] = useState('')
  const [formSatuan, setFormSatuan] = useState('pcs')
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Pengaturan bagi hasil
  const [bagiHasil, setBagiHasil] = useState('')
  const [savingBagi, setSavingBagi] = useState(false)

  const fetchData = async () => {
    const [{ data: jc }, { data: pg }] = await Promise.all([
      supabase.from('jenis_cucian').select('*').order('id'),
      supabase.from('pengaturan').select('*'),
    ])
    if (jc) setJenisList(jc as JenisCucian[])
    if (pg) {
      setPengaturan(pg as Pengaturan[])
      const bh = pg.find((p: Pengaturan) => p.kunci === 'bagi_hasil_persen')
      if (bh) setBagiHasil(bh.nilai)
    }
  }

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user) { router.push('/owner/login'); return }
      const profile = await getUserProfile(user.id)
      if (profile && profile.role !== 'owner') { router.push('/owner/login'); return }
      await fetchData()
      setLoading(false)
    }
    init()
  }, [router])

  const resetForm = () => {
    setEditId(null)
    setFormNama('')
    setFormDeskripsi('')
    setFormHargaKiloan('')
    setFormHargaSatuan('')
    setFormSatuan('pcs')
    setFormError('')
    setShowForm(false)
  }

  const handleEdit = (item: JenisCucian) => {
    setEditId(item.id)
    setFormNama(item.nama)
    setFormDeskripsi(item.deskripsi ?? '')
    setFormHargaKiloan(item.harga_kiloan?.toString() ?? '')
    setFormHargaSatuan(item.harga_satuan?.toString() ?? '')
    setFormSatuan(item.satuan)
    setShowForm(true)
  }

  const handleSaveJenis = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!formNama.trim()) { setFormError('Nama wajib diisi.'); return }
    if (!formHargaKiloan && !formHargaSatuan) {
      setFormError('Isi minimal salah satu harga (kiloan atau satuan).')
      return
    }
    setFormSaving(true)
    try {
      const payload = {
        nama: formNama.trim(),
        deskripsi: formDeskripsi || null,
        harga_kiloan: formHargaKiloan ? Number(formHargaKiloan) : null,
        harga_satuan: formHargaSatuan ? Number(formHargaSatuan) : null,
        satuan: formSatuan,
        updated_at: new Date().toISOString(),
      }
      if (editId) {
        const { error } = await supabase.from('jenis_cucian').update(payload).eq('id', editId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('jenis_cucian').insert({ ...payload, is_active: true })
        if (error) throw error
      }
      await fetchData()
      resetForm()
    } catch (err: any) {
      setFormError(err.message ?? 'Gagal menyimpan.')
    } finally {
      setFormSaving(false)
    }
  }

  const handleToggleActive = async (id: number, current: boolean) => {
    await supabase.from('jenis_cucian').update({ is_active: !current }).eq('id', id)
    await fetchData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus jenis cucian ini?')) return
    const { error } = await supabase.from('jenis_cucian').delete().eq('id', id)
    if (error) { alert('Tidak bisa dihapus karena sudah dipakai di order.'); return }
    await fetchData()
  }

  const handleSaveBagiHasil = async () => {
    setSavingBagi(true)
    await supabase.from('pengaturan')
      .upsert({ kunci: 'bagi_hasil_persen', nilai: bagiHasil, keterangan: 'Persentase bagi hasil ke pusat (%)' })
    setSavingBagi(false)
    alert('Pengaturan bagi hasil disimpan.')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧺</span>
            <div>
              <p className="font-bold text-gray-900 leading-none">Master Data</p>
              <p className="text-xs text-gray-500 mt-0.5">Kelola jenis cucian & pengaturan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/owner/dashboard" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
              <Home size={16} /> Dashboard
            </Link>
            <button onClick={() => { logoutUser(); router.push('/') }}
              className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition">
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button onClick={() => setActiveTab('jenis')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'jenis' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <span className="flex items-center gap-2"><Package size={15} /> Jenis Cucian</span>
          </button>
          <button onClick={() => setActiveTab('pengaturan')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'pengaturan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <span className="flex items-center gap-2"><Settings size={15} /> Pengaturan Bagi Hasil</span>
          </button>
        </div>

        {/* Tab: Jenis Cucian */}
        {activeTab === 'jenis' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">Daftar Jenis Cucian</h2>
              <button onClick={() => { resetForm(); setShowForm(true) }}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
                <Plus size={16} /> Tambah Jenis
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <div className="bg-white rounded-xl border-2 border-purple-200 p-6 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">{editId ? 'Edit Jenis Cucian' : 'Tambah Jenis Cucian'}</h3>
                  <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                {formError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">{formError}</div>}
                <form onSubmit={handleSaveJenis} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item *</label>
                    <input type="text" value={formNama} onChange={e => setFormNama(e.target.value)}
                      placeholder="Contoh: Jas, Baju, Sepatu..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <input type="text" value={formDeskripsi} onChange={e => setFormDeskripsi(e.target.value)}
                      placeholder="Keterangan singkat..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Kiloan (Rp/kg)</label>
                    <input type="number" value={formHargaKiloan} onChange={e => setFormHargaKiloan(e.target.value)}
                      placeholder="Kosongkan jika tidak ada"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Satuan (Rp/pcs)</label>
                    <input type="number" value={formHargaSatuan} onChange={e => setFormHargaSatuan(e.target.value)}
                      placeholder="Kosongkan jika tidak ada"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                    <select value={formSatuan} onChange={e => setFormSatuan(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="pasang">pasang</option>
                      <option value="lembar">lembar</option>
                    </select>
                  </div>
                  <div className="col-span-2 flex gap-3 pt-2">
                    <button type="button" onClick={resetForm}
                      className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                      Batal
                    </button>
                    <button type="submit" disabled={formSaving}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                      <Save size={15} /> {formSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Nama Item</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Harga Kiloan</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Harga Satuan</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Satuan</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {jenisList.map(item => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {item.nama}
                        {item.deskripsi && <p className="text-xs text-gray-400 mt-0.5">{item.deskripsi}</p>}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{item.harga_kiloan ? formatRupiah(item.harga_kiloan) + '/kg' : '—'}</td>
                      <td className="px-5 py-4 text-gray-700">{item.harga_satuan ? formatRupiah(item.harga_satuan) + '/' + item.satuan : '—'}</td>
                      <td className="px-5 py-4 text-gray-500">{item.satuan}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => handleToggleActive(item.id, item.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Pengaturan Bagi Hasil */}
        {activeTab === 'pengaturan' && (
          <div className="max-w-lg">
            <h2 className="font-bold text-gray-900 text-lg mb-6">Pengaturan Bagi Hasil</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persentase Bagi Hasil ke Pusat (%)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    value={bagiHasil}
                    onChange={e => setBagiHasil(e.target.value)}
                    min="0" max="100" step="0.5"
                    className="w-32 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-gray-500 text-sm">%</span>
                  <button onClick={handleSaveBagiHasil} disabled={savingBagi}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
                    <Save size={15} /> {savingBagi ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Setiap order akan otomatis dipotong {bagiHasil}% sebagai bagi hasil ke pusat.
                </p>
              </div>

              {/* Preview kalkulasi */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm font-semibold text-purple-900 mb-3">Contoh Kalkulasi</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Order</span>
                    <span className="font-medium">Rp 100.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bagi Hasil Pusat ({bagiHasil}%)</span>
                    <span className="font-medium text-red-600">- Rp {((Number(bagiHasil) / 100) * 100000).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="border-t border-purple-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-800">Pendapatan Bersih Cabang</span>
                    <span className="font-bold text-green-700">Rp {((1 - Number(bagiHasil) / 100) * 100000).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
