import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Instrument_Serif } from 'next/font/google'

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'onepdf — your PDFs never leave your browser',
  description:
    'Open-source, browser-only PDF toolkit. Merge, compress, and edit PDFs on your device — nothing uploaded, nothing tracked.',
  icons: {
    icon: '/favicon-logo.svg',
    apple: '/favicon-logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${instrumentSerif.variable} antialiased`}
          suppressHydrationWarning
        >
          <Navbar />
          <div className="pt-14">{children}</div>
          <Footer />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
