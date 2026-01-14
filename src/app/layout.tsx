import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DC Power Operations Simulator',
  description: 'Interactive 3D visualization of data center power operations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
