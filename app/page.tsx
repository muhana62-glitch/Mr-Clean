import Link from 'next/link'
import { getWhatsAppLink } from '@/lib/utils'
import {
  MessageCircle,
  MapPin,
  Phone,
  Clock,
  Star,
  CheckCircle,
  Shirt,
  Wind,
  Sparkles,
  Package,
  ChevronRight,
} from 'lucide-react'

const WA_NUMBER = '081902156350'
const WA_LINK = getWhatsAppLink(WA_NUMBER)

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo_mrclean.png" alt="Mr. Clean" className="h-10 w-auto" />
            <div>
              <span className="font-bold text-blue-900 text-lg leading-none">Mr. Clean</span>
              <span className="block text-xs text-gray-500 leading-none">One Stop Laundry</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#layanan" className="hover:text-blue-600 transition">Layanan</a>
            <a href="#harga" className="hover:text-blue-600 transition">Harga</a>
            <a href="#kontak" className="hover:text-blue-600 transition">Kontak</a>
          </div>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-700/50 text-blue-200 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              Laundry Terpercaya di Brebes
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Bersih, Wangi,<br />
              <span className="text-yellow-400">Tepat Waktu.</span>
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-md">
              Mr. Clean One Stop Laundry hadir untuk memudahkan urusan cucian Anda.
              Cuci kiloan, dry cleaning, hingga sepatu — semua bisa di sini.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3 rounded-xl transition text-base"
              >
                <MessageCircle size={20} />
                Pesan via WhatsApp
              </a>
              <Link
                href="/pelanggan/login"
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition text-base border border-white/20"
              >
                Cek Status Cucian
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 bg-blue-600/40 rounded-full flex items-center justify-center">
                <span className="text-9xl md:text-[10rem] select-none">🧺</span>
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-blue-900 font-bold text-sm px-3 py-1.5 rounded-full shadow-lg">
                ✓ Buka 08.00–17.00
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white text-blue-900 font-bold text-sm px-3 py-1.5 rounded-full shadow-lg">
                📍 Brebes, Jawa Tengah
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KEUNGGULAN ── */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Express 1 Hari', desc: 'Selesai hari yang sama' },
              { icon: '💧', title: 'Bersih Maksimal', desc: 'Deterjen premium pilihan' },
              { icon: '🌸', title: 'Wangi Tahan Lama', desc: 'Pewangi berkualitas' },
              { icon: '🕗', title: 'Buka 08.00–17.00', desc: 'Senin sampai Minggu' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LAYANAN ── */}
      <section id="layanan" className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Layanan Kami</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Semua kebutuhan laundry Anda tersedia dalam satu tempat
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Shirt size={28} className="text-blue-600" />,
              title: 'Cuci Kiloan',
              desc: 'Cuci reguler dan express untuk pakaian sehari-hari. Bersih, wangi, dan rapi.',
              badge: 'Mulai Rp 7.000/kg',
              color: 'border-blue-200 bg-blue-50',
            },
            {
              icon: <Sparkles size={28} className="text-purple-600" />,
              title: 'Dry Cleaning',
              desc: 'Pembersihan khusus untuk pakaian sensitif, jas, gaun, dan bahan premium.',
              badge: 'Mulai Rp 25.000/pcs',
              color: 'border-purple-200 bg-purple-50',
            },
            {
              icon: <Wind size={28} className="text-green-600" />,
              title: 'Cuci + Setrika',
              desc: 'Pakaian dicuci bersih lalu disetrika rapi. Siap pakai langsung.',
              badge: 'Mulai Rp 10.000/kg',
              color: 'border-green-200 bg-green-50',
            },
            {
              icon: <Package size={28} className="text-orange-600" />,
              title: 'Cuci Sepatu',
              desc: 'Sepatu dicuci bersih, disikat, dan dikeringkan dengan sempurna.',
              badge: 'Mulai Rp 35.000/pasang',
              color: 'border-orange-200 bg-orange-50',
            },
            {
              icon: <Package size={28} className="text-pink-600" />,
              title: 'Cuci Tas',
              desc: 'Tas berbagai jenis dibersihkan dengan teknik yang tepat sesuai bahan.',
              badge: 'Mulai Rp 40.000/pcs',
              color: 'border-pink-200 bg-pink-50',
            },
            {
              icon: <Shirt size={28} className="text-teal-600" />,
              title: 'Selimut & Bed Cover',
              desc: 'Cuci selimut, bed cover, dan sprei besar dengan mesin kapasitas besar.',
              badge: 'Mulai Rp 30.000/pcs',
              color: 'border-teal-200 bg-teal-50',
            },
          ].map((s) => (
            <div
              key={s.title}
              className={`rounded-xl p-6 border-2 ${s.color} hover:shadow-md transition`}
            >
              <div className="mb-3">{s.icon}</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{s.desc}</p>
              <span className="inline-block bg-white text-gray-700 text-xs font-semibold px-3 py-1 rounded-full border border-gray-200">
                {s.badge}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HARGA ── */}
      <section id="harga" className="bg-blue-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold mb-3">Daftar Harga</h2>
            <p className="text-blue-200">Harga transparan, tidak ada biaya tersembunyi</p>
          </div>
          <div className="bg-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/10 text-blue-200 text-left">
                  <th className="px-6 py-4 font-semibold">Layanan</th>
                  <th className="px-6 py-4 font-semibold text-right">Harga</th>
                  <th className="px-6 py-4 font-semibold text-right">Estimasi</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { nama: 'Cuci Reguler', harga: 'Rp 7.000 / kg', est: '2–3 hari' },
                  { nama: 'Cuci Express', harga: 'Rp 12.000 / kg', est: 'Hari ini' },
                  { nama: 'Cuci + Setrika', harga: 'Rp 10.000 / kg', est: '2–3 hari' },
                  { nama: 'Setrika Saja', harga: 'Rp 5.000 / kg', est: '1 hari' },
                  { nama: 'Dry Cleaning', harga: 'Rp 25.000 / pcs', est: '3–5 hari' },
                  { nama: 'Cuci Sepatu', harga: 'Rp 35.000 / pasang', est: '2–3 hari' },
                  { nama: 'Cuci Tas', harga: 'Rp 40.000 / pcs', est: '2–3 hari' },
                  { nama: 'Selimut / Bed Cover', harga: 'Rp 30.000 / pcs', est: '2–3 hari' },
                ].map((item, i) => (
                  <tr key={item.nama} className={i % 2 === 0 ? '' : 'bg-white/5'}>
                    <td className="px-6 py-3 font-medium">{item.nama}</td>
                    <td className="px-6 py-3 text-right text-yellow-300 font-semibold">{item.harga}</td>
                    <td className="px-6 py-3 text-right text-blue-200">{item.est}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-blue-300 text-xs mt-4">
            * Harga dapat berubah. Hubungi kami untuk konfirmasi harga terkini.
          </p>
        </div>
      </section>

      {/* ── PORTAL LOGIN ── */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Portal Pengguna</h2>
          <p className="text-gray-500">Masuk sesuai peran Anda untuk mengakses dashboard</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Pelanggan */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 text-center hover:shadow-lg transition">
            <div className="text-5xl mb-4">👕</div>
            <h3 className="text-xl font-bold text-green-900 mb-2">Pelanggan</h3>
            <p className="text-gray-600 text-sm mb-6">
              Cek status cucian, lihat riwayat order, dan download invoice Anda
            </p>
            <div className="space-y-2">
              <Link
                href="/pelanggan/login"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition"
              >
                Login Pelanggan
              </Link>
            </div>
          </div>

          {/* Karyawan */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200 rounded-2xl p-8 text-center hover:shadow-lg transition">
            <div className="text-5xl mb-4">👷</div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Karyawan</h3>
            <p className="text-gray-600 text-sm mb-6">
              Kelola pesanan masuk, update status cucian, dan catat transaksi
            </p>
            <Link
              href="/karyawan/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition"
            >
              Login Karyawan
            </Link>
          </div>

          {/* Owner */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-8 text-center hover:shadow-lg transition">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-purple-900 mb-2">Owner</h3>
            <p className="text-gray-600 text-sm mb-6">
              Monitor pendapatan, laporan bisnis, dan manajemen karyawan
            </p>
            <Link
              href="/owner/login"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition"
            >
              Login Owner
            </Link>
          </div>
        </div>
      </section>

      {/* ── KONTAK ── */}
      <section id="kontak" className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Hubungi Kami</h2>
            <p className="text-gray-500">Kami siap melayani Anda</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <MapPin className="mx-auto text-blue-600 mb-3" size={28} />
              <h4 className="font-bold text-gray-800 mb-1">Alamat</h4>
              <a
                href="https://www.google.com/maps?q=-6.875762001312784,109.0597064784508"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                Limbangan Wetan, Kec. Brebes,<br />
                Kabupaten Brebes,<br />
                Jawa Tengah
              </a>
              <div className="mt-3">
                <a
                  href="https://www.google.com/maps?q=-6.875762001312784,109.0597064784508"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition"
                >
                  <MapPin size={12} /> Buka Maps
                </a>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <Phone className="mx-auto text-green-600 mb-3" size={28} />
              <h4 className="font-bold text-gray-800 mb-1">WhatsApp</h4>
              <p className="text-gray-600 text-sm mb-3">0819-0215-6350</p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
              >
                <MessageCircle size={14} />
                Chat Sekarang
              </a>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <Clock className="mx-auto text-orange-600 mb-3" size={28} />
              <h4 className="font-bold text-gray-800 mb-1">Jam Operasional</h4>
              <p className="text-gray-600 text-sm">
                Senin – Minggu<br />
                <span className="font-semibold text-gray-800">08.00 – 17.00 WIB</span><br />
                <span className="text-green-600 font-medium text-xs mt-1 block">Buka setiap hari</span>
              </p>
            </div>
          </div>

          {/* CTA WhatsApp */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Mau Pesan Laundry?</h3>
            <p className="text-green-100 mb-6">
              Hubungi kami via WhatsApp untuk pemesanan, antar jemput, atau pertanyaan seputar layanan
            </p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition text-base"
            >
              <MessageCircle size={20} />
              Chat WhatsApp — 0819-0215-6350
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-blue-900 text-blue-200 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo_mrclean.png" alt="Mr. Clean" className="h-10 w-auto" />
            <div>
              <p className="font-bold text-white">Mr. Clean One Stop Laundry</p>
              <p className="text-xs text-blue-300">Limbangan Wetan, Brebes, Jawa Tengah</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/pelanggan/login" className="hover:text-white transition">Portal Pelanggan</Link>
            <Link href="/karyawan/login" className="hover:text-white transition">Portal Karyawan</Link>
            <Link href="/owner/login" className="hover:text-white transition">Portal Owner</Link>
          </div>
          <p className="text-xs text-blue-400">© 2025 Mr. Clean Laundry. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
