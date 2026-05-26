import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Mr. Clean One Stop Laundry — Brebes',
  description: 'Jasa laundry terpercaya di Brebes, Jawa Tengah. Cuci kiloan, dry cleaning, sepatu, tas, dan selimut. Bersih, wangi, tepat waktu.',
  keywords: 'laundry brebes, cuci kiloan brebes, mr clean laundry, laundry limbangan wetan',
  openGraph: {
    title: 'Mr. Clean One Stop Laundry',
    description: 'Jasa laundry terpercaya di Brebes, Jawa Tengah.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  )
}
