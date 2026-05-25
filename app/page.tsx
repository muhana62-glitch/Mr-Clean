import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            Mr. Clean
          </h1>
          <p className="text-xl text-blue-700 mb-2">
            Laundry Management System
          </p>
          <p className="text-gray-600">
            Limbangan Wetan, Kec. Brebes, Kabupaten Brebes, Jawa Tengah
          </p>
        </div>

        {/* 3 Platform Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Karyawan */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="text-4xl mb-4">👷</div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              Platform Karyawan
            </h2>
            <p className="text-gray-600 mb-6">
              Manage orders, update status, dan track progress pekerjaan
            </p>
            <Link
              href="/karyawan/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Login Karyawan
            </Link>
          </div>

          {/* Owner */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              Platform Owner
            </h2>
            <p className="text-gray-600 mb-6">
              Monitor bisnis, laporan pendapatan, dan manajemen karyawan
            </p>
            <Link
              href="/owner/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Login Owner
            </Link>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="text-4xl mb-4">👕</div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              Platform Customer
            </h2>
            <p className="text-gray-600 mb-6">
              Order laundry, tracking status, dan download invoice
            </p>
            <Link
              href="/customer/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Login Customer
            </Link>
          </div>
        </div>

        {/* WhatsApp Button */}
        <div className="text-center">
          <a
            href="https://wa.me/081902156350?text=Halo%20Mr.%20Clean,%20saya%20ingin%20bertanya%20tentang%20layanan%20laundry"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-8 py-4 rounded-lg hover:bg-green-600 transition text-lg font-semibold"
          >
            <MessageCircle size={24} />
            Chat WhatsApp (081902156350)
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600">
          <p>© 2025 Mr. Clean Laundry. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
