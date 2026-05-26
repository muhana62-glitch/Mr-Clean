'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, logoutUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, KeyRound, LogOut, Home, X, Save, Eye, EyeOff, UserCheck } from 'lucide-react'

interface Karyawan {
  id: number
  posisi: string | null
  status: string
  user_id: string
  users: { id: string; nama: string; email: string; no_hp: string | null }
}

export default function ManajemenKaryawan() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([])
  const [callerToken, setCallerToken] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form tambah karyawan
  const [showForm, setShowForm] = useState(false)
  const [formNama, setFormNama] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formNoHp, setFormNoHp] = useState('')
  const [formPosisi, setFormPosisi] = useState('Staff Laundry')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  // Modal reset password
  const [resetUserId, setResetUserId] = useState('')
  const [resetNama, setResetNama] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [resetting, setResetting] = useState(false)

  const fetchKaryawan = async () => {
    const { data } = await supabase
      .from('karyawan')
      .select('id, posisi, status, user_id, users:user_id(id, nama, email, no_hp)')
      .order('id')
    if (data) setKaryawanList(data as any)
  }

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user) { router.push('/owner/login'); return }

      // Ambil session token untuk API calls
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setCallerToken(session.access_token)

      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (profile?.role !== 'owner') { router.push('/owner/login'); return }

      await fetchKaryawan()
      setLoading(false)
    }
    init()
  }, [router])

  const resetForm = () => {
    setFormNama(''); setFormEmail(''); setFormPassword('')
    setFormNoHp(''); setFormPosisi('Staff Laundry')
    setShowForm(false); setError(''); setSuccess('')
  }

  const handleTambah = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail, password: formPassword,
          nama: formNama, no_hp: formNoHp,
          posisi: formPosisi, callerToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(`Akun karyawan ${formNama} berhasil dibuat.`)
      resetForm()
      await fetchKaryawan()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleHapus = async (userId: string, nama: string) => {
    if (!confirm(`Hapus akun karyawan ${nama}? Akun tidak bisa dipulihkan.`)) return
    setError(''); setSuccess('')
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, callerToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(`Akun ${nama} berhasil dihapus.`)
      await fetchKaryawan()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword) { setError('Password baru wajib diisi.'); return }
    setResetting(true); setError('')
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: resetUserId, newPassword, callerToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(`Password ${resetNama} berhasil direset.`)
      setResetUserId(''); setNewPassword('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResetting(false)
    }
  }

  const handleToggleStatus = async (karId: number, current: string) => {
    const newStatus = current === 'aktif' ? 'nonaktif' : 'aktif'
    await supabase.from('karyawan').update({ status: newStatus }).eq('id', karId)
    await fetchKaryawan()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo_mrclean.png" alt="Mr. Clean" className="h-9 w-auto" />
            <div>
              <p className="font-bold text-gray-900 leading-none">Manajemen Karyawan</p>
              <p className="text-xs text-gray-500 mt-0.5">Kelola akun karyawan</p>
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex justify-between">
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={() => setError('')}><X size={16} className="text-red-400" /></button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex justify-between">
            <p className="text-green-700 text-sm">{success}</p>
            <button onClick={() => setSuccess('')}><X size={16} className="text-green-400" /></button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-900 text-lg">Daftar Karyawan ({karyawanList.length})</h2>
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
            <Plus size={16} /> Tambah Karyawan
          </button>
        </div>

        {/* Form Tambah */}
        {showForm && (
          <div className="bg-white rounded-xl border-2 border-purple-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Buat Akun Karyawan Baru</h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleTambah} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                <input type="text" value={formNama} onChange={e => setFormNama(e.target.value)}
                  placeholder="Nama karyawan" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                  placeholder="nama@mrclean.com" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={formPassword} onChange={e => setFormPassword(e.target.value)}
                    placeholder="Min. 6 karakter" required
                    className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
                <input type="tel" value={formNoHp} onChange={e => setFormNoHp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Posisi</label>
                <input type="text" value={formPosisi} onChange={e => setFormPosisi(e.target.value)}
                  placeholder="Staff Laundry"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="button" onClick={resetForm}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Batal</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                  <Save size={15} /> {saving ? 'Membuat...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Reset Password */}
        {resetUserId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Reset Password — {resetNama}</h3>
                <button onClick={() => { setResetUserId(''); setNewPassword('') }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Masukkan password baru untuk karyawan ini.</p>
              <div className="relative mb-4">
                <input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Password baru (min. 6 karakter)"
                  className="w-full px-3 py-2.5 pr-9 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setResetUserId(''); setNewPassword('') }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Batal</button>
                <button onClick={handleResetPassword} disabled={resetting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                  {resetting ? 'Mereset...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabel Karyawan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {karyawanList.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p>Belum ada karyawan. Klik "Tambah Karyawan" untuk membuat akun.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Nama</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Posisi</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {karyawanList.map(k => (
                  <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-5 py-4 font-semibold text-gray-900">{k.users?.nama}</td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{k.users?.email}</td>
                    <td className="px-5 py-4 text-gray-600">{k.posisi ?? 'Staff Laundry'}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleToggleStatus(k.id, k.status)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${k.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {k.status === 'aktif' ? '✓ Aktif' : '✕ Nonaktif'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setResetUserId(k.users?.id); setResetNama(k.users?.nama); setError(''); setSuccess('') }}
                          title="Reset Password"
                          className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg transition font-medium">
                          <KeyRound size={13} /> Reset PW
                        </button>
                        <button
                          onClick={() => handleHapus(k.users?.id, k.users?.nama)}
                          title="Hapus Akun"
                          className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-1.5 rounded-lg transition font-medium">
                          <Trash2 size={13} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info keamanan */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 text-sm font-semibold mb-1">⚠️ Catatan Keamanan</p>
          <ul className="text-yellow-700 text-xs space-y-1">
            <li>• Karyawan yang keluar: segera <strong>hapus akun</strong> atau set status <strong>Nonaktif</strong></li>
            <li>• Karyawan tidak bisa ganti password sendiri — hanya owner yang bisa reset</li>
            <li>• Gunakan email format: <strong>nama@mrclean.com</strong> untuk akun karyawan</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
