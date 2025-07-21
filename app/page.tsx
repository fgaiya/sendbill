import { auth } from '@clerk/nextjs/server';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { CTAButton } from '@/components/ui/CTAButton';
import { APP_CONFIG } from '@/lib/shared/config';
import { cn } from '@/lib/shared/utils/ui';

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header />

      <main
        className={cn(
          'flex-1 mx-auto',
          APP_CONFIG.UI.LAYOUT.CONTAINER_MAX_WIDTH,
          'py-16 px-4 sm:py-24 sm:px-6 lg:px-8'
        )}
      >
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
              <CTAButton variant="primary" size="large" href="/dashboard">
                ダッシュボードへ
              </CTAButton>
            ) : (
              <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                <CTAButton variant="primary" size="large" href="/sign-up">
                  始める
                </CTAButton>
                <CTAButton variant="secondary" size="large" href="/sign-in">
                  ログイン
                </CTAButton>
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
  );
}
