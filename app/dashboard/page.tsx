import Link from 'next/link';

import { currentUser } from '@clerk/nextjs/server';

import { APP_CONFIG } from '@/lib/shared/config';
import { cn } from '@/lib/shared/utils/ui';

export default async function DashboardPage() {
  try {
    const user = await currentUser();

    return (
      <div
        className={cn(
          'mx-auto',
          APP_CONFIG.UI.LAYOUT.CONTAINER_MAX_WIDTH,
          APP_CONFIG.UI.LAYOUT.CONTENT_PADDING
        )}
      >
        <div className={APP_CONFIG.UI.LAYOUT.DASHBOARD_PADDING}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              ダッシュボード
            </h1>
            <p className="mt-2 text-gray-600">SendBillの管理画面へようこそ</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* 会社情報カード */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                会社情報
              </h3>
              <p className="text-gray-600 mb-4">
                請求書や見積書に表示される会社の基本情報を管理します
              </p>
              <Link
                href="/dashboard/company"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                設定する
              </Link>
            </div>

            {/* 取引先管理カード */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                取引先管理
              </h3>
              <p className="text-gray-600 mb-4">
                請求先となる取引先の情報を管理します
              </p>
              <div className="space-y-2">
                <Link
                  href="/dashboard/clients"
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  一覧を見る
                </Link>
                <Link
                  href="/dashboard/clients/new"
                  className="block w-full text-center px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  新規登録
                </Link>
              </div>
            </div>

            {/* 見積書管理カード */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                見積書管理
              </h3>
              <p className="text-gray-600 mb-4">
                見積書の作成・送信・管理を行います
              </p>
              <div className="space-y-2">
                <Link
                  href="/dashboard/quotes"
                  className="block w-full text-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
                >
                  一覧を見る
                </Link>
                <Link
                  href="/dashboard/quotes/new"
                  className="block w-full text-center px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-md hover:bg-emerald-100 transition-colors border border-emerald-200"
                >
                  新規作成
                </Link>
              </div>
            </div>

            {/* 請求書管理カード */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                請求書管理
              </h3>
              <p className="text-gray-600 mb-4">
                請求書の作成・送信・管理を行います
              </p>
              <div className="space-y-2">
                <Link
                  href="/dashboard/invoices"
                  className="block w-full text-center px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700 transition-colors"
                >
                  一覧を見る
                </Link>
                <Link
                  href="/dashboard/invoices/new"
                  className="block w-full text-center px-4 py-2 bg-violet-50 text-violet-700 text-sm font-medium rounded-md hover:bg-violet-100 transition-colors border border-violet-200"
                >
                  新規作成
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-green-800">認証情報</h3>
            <dl className="mt-2 text-sm text-green-700">
              <div>
                <dt className="inline font-medium">ユーザー名: </dt>
                <dd className="inline">{user?.firstName || 'ユーザー'}さん</dd>
              </div>
              <div>
                <dt className="inline font-medium">メールアドレス: </dt>
                <dd className="inline">
                  {user?.emailAddresses[0]?.emailAddress || '未設定'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch user information:', error);
    return (
      <div
        className={cn(
          'mx-auto',
          APP_CONFIG.UI.LAYOUT.CONTAINER_MAX_WIDTH,
          APP_CONFIG.UI.LAYOUT.CONTENT_PADDING
        )}
      >
        <h1 className="text-xl font-bold text-red-600">
          認証情報の取得に失敗しました
        </h1>
      </div>
    );
  }
}
