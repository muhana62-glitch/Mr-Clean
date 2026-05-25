export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function getWhatsAppLink(
  phoneNumber: string,
  message?: string
): string {
  const encodedMessage = encodeURIComponent(
    message || 'Halo Mr. Clean, saya ingin bertanya tentang layanan laundry'
  )
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`
}

export function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `ORD-${timestamp}-${random}`
}

export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(5, '0')
  return `INV-${year}${month}${day}-${random}`
}
