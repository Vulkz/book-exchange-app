import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { AuthProvider } from "@/contexts/AuthContext"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "BookShare - Troca e Doação de Livros",
  description: "Plataforma para troca e doação de livros entre leitores",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans ${dmSans.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
