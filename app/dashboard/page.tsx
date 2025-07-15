import { auth, currentUser } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              ダッシュボード
            </h1>
            <UserButton />
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              こんにちは、{user?.firstName || 'ユーザー'}さん！
            </h2>
            <p className="text-gray-600">
              SendBillへようこそ。認証システムが正常に動作しています。
            </p>
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-green-800">
                認証情報
              </h3>
              <dl className="mt-2 text-sm text-green-700">
                <div>
                  <dt className="inline font-medium">ユーザーID: </dt>
                  <dd className="inline">{userId}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">メールアドレス: </dt>
                  <dd className="inline">{user?.emailAddresses[0]?.emailAddress || '未設定'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}