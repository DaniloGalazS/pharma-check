import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'PharmaCheck — Compara precios de medicamentos en Chile',
    template: '%s | PharmaCheck',
  },
  description:
    'Busca y compara precios de medicamentos en Cruz Verde, Salcobrand, Ahumada y Farmacias Similares. Ahorra dinero en tus medicamentos.',
  keywords: ['farmacias', 'medicamentos', 'precios', 'Chile', 'comparar', 'Cruz Verde', 'Salcobrand'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
