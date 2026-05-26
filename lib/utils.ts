// ─── Format Rupiah ────────────────────────────────────────────────────────────
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ─── Format Tanggal Indonesia ─────────────────────────────────────────────────
export function formatTanggal(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatTanggalPendek(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

// ─── WhatsApp Link ────────────────────────────────────────────────────────────
export function getWhatsAppLink(phone: string, message?: string): string {
  const msg = encodeURIComponent(
    message ?? 'Halo Mr. Clean, saya ingin bertanya tentang layanan laundry'
  )
  const number = phone.replace(/^0/, '62').replace(/\D/g, '')
  return `https://wa.me/${number}?text=${msg}`
}

// ─── Generate Nomor Order ─────────────────────────────────────────────────────
export function generateNoOrder(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `MRC-${y}${m}${d}-${rand}`
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export type OrderStatus = 'diterima' | 'diproses' | 'selesai' | 'diambil' | 'dibatalkan'

export function getStatusLabel(status: OrderStatus | string): string {
  const labels: Record<string, string> = {
    diterima: 'Diterima',
    diproses: 'Diproses',
    selesai: 'Selesai',
    diambil: 'Diambil',
    dibatalkan: 'Dibatalkan',
  }
  return labels[status] ?? status
}

export function getStatusColor(status: OrderStatus | string): string {
  const colors: Record<string, string> = {
    diterima: 'bg-blue-100 text-blue-800',
    diproses: 'bg-yellow-100 text-yellow-800',
    selesai: 'bg-green-100 text-green-800',
    diambil: 'bg-gray-100 text-gray-700',
    dibatalkan: 'bg-red-100 text-red-800',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-700'
}
