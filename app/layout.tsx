import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Mr. Clean One Stop Laundry — Brebes',
  description: 'Jasa laundry terpercaya di Brebes, Jawa Tengah. Cuci kiloan, dry cleaning, sepatu, tas, dan selimut.',
  keywords: 'laundry brebes, cuci kiloan brebes, mr clean laundry, laundry limbangan wetan',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mr. Clean',
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: 'Mr. Clean One Stop Laundry',
    description: 'Jasa laundry terpercaya di Brebes, Jawa Tengah.',
    type: 'website',
  },
  icons: {
    icon: '/logo_mrclean.png',
    apple: '/logo_mrclean.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mr. Clean" />
        <link rel="apple-touch-icon" href="/logo_mrclean.png" />
      </head>
      <body className="antialiased">
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(reg) { console.log('SW registered'); })
                  .catch(function(err) { console.log('SW error:', err); });
              });
            }
          `
        }} />
      </body>
    </html>
  )
}
