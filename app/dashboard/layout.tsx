import type { Metadata } from "next"
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import { SidebarProvider } from '@/lib/domains/navigation/contexts/SidebarContext'

export const metadata: Metadata = {
  title: "ダッシュボード - SendBill",
  description: "SendBillのダッシュボードで請求書の作成・管理・送信を効率化。統計情報とお客様管理機能。",
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <div className="md:ml-16 transition-all duration-300 ease-in-out">
          <main className="min-h-screen">
            <div className="p-6">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  )
}
