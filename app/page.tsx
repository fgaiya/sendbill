import { auth } from '@clerk/nextjs/server'
import Link from "next/link"
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default async function Home() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header />
      
      <main className="flex-1 mx-auto max-w-7xl py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">請求書管理を</span>
            <span className="block text-blue-600">シンプルに</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            SendBillで請求書の作成・管理・送信を効率化。認証システムが組み込まれた安全で使いやすいプラットフォームです。
          </p>
          <div className="mx-auto mt-10 max-w-sm sm:max-w-none sm:flex sm:justify-center">
            {userId ? (
              <Link
                href="/dashboard"
                className="flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 md:py-4 md:px-10 md:text-lg transition-colors"
              >
                ダッシュボードへ
              </Link>
            ) : (
              <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                <Link
                  href="/sign-up"
                  className="flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 md:py-4 md:px-10 md:text-lg transition-colors"
                >
                  始める
                </Link>
                <Link
                  href="/sign-in"
                  className="flex items-center justify-center rounded-md border border-blue-600 bg-white px-8 py-3 text-base font-medium text-blue-600 hover:bg-blue-50 md:py-4 md:px-10 md:text-lg transition-colors"
                >
                  ログイン
                </Link>
              </div>
            )}
          </div>
        </div>

        {userId && (
          <div className="mt-16 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                認証システム動作確認
              </h3>
              <p className="text-green-700">
                Clerk SDKが正常に動作し、ユーザー認証が完了しています。
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
