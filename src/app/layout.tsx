import type { Metadata } from 'next'
import { Cormorant_Garamond, Raleway } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'SJ Estudio de Uñas — Panel de Gestión',
  description: 'Plataforma de gestión de citas para salones de belleza, estética y cuidado personal.',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body
        className={`${cormorant.variable} ${raleway.variable} antialiased text-slate-900`}
        style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
