import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '700', '800'],
  style: ['normal', 'italic'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'MiCita Platform — Panel de Gestión',
  description: 'La plataforma inteligente para negocios que trabajan con citas.',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body
        className={`${playfairDisplay.variable} ${inter.variable} antialiased`}
        style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}