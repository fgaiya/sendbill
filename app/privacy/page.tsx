import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | SendBill',
  description: 'SendBillのプライバシーポリシー・個人情報保護方針',
};

export default function PrivacyPage() {
  const lastUpdated = '2025年9月1日';

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            プライバシーポリシー
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            SendBillにおける個人情報の取り扱いについて
          </p>
          <p className="mt-2 text-sm text-gray-500">
            最終更新日: {lastUpdated}
          </p>
        </div>

        <div className="prose max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. 基本方針
              </h2>
              <p className="text-gray-700 leading-relaxed">
                SendBill（以下「当サービス」）は、ユーザーの個人情報を適切に保護することを重要な責務と考えております。本プライバシーポリシーでは、当サービスがどのような個人情報を収集し、どのように利用・保護するかについて説明いたします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. 収集する情報
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    2.1 アカウント情報
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>メールアドレス</li>
                    <li>氏名</li>
                    <li>プロフィール画像（任意）</li>
                    <li>認証情報</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    2.2 事業者情報
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>会社名・屋号</li>
                    <li>代表者名</li>
                    <li>住所</li>
                    <li>電話番号</li>
                    <li>銀行口座情報</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    2.3 取引先情報
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>顧客の会社名・氏名</li>
                    <li>連絡先情報</li>
                    <li>請求・取引履歴</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    2.4 自動収集される情報
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>IPアドレス</li>
                    <li>ブラウザ情報</li>
                    <li>アクセス日時・頻度</li>
                    <li>利用状況・操作ログ</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. 情報の利用目的
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>サービスの提供・運営</li>
                <li>ユーザーサポートの提供</li>
                <li>サービスの改善・新機能の開発</li>
                <li>不正利用の防止・セキュリティ対策</li>
                <li>法的要求への対応</li>
                <li>重要なお知らせの配信</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. 情報の第三者提供
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>ユーザーの明示的な同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>
                  サービス提供に必要な業務委託先への提供（適切な管理下において）
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. データの保存と管理
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  収集した個人情報は、適切なセキュリティ対策を講じた上で保存いたします。データはクラウド環境において暗号化され、定期的なバックアップと監査を実施しています。
                </p>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    セキュリティ対策
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>SSL/TLS暗号化通信</li>
                    <li>データベース暗号化</li>
                    <li>アクセス制御・認証システム</li>
                    <li>定期的なセキュリティ監査</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Cookieの使用
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                当サービスでは、ユーザーエクスペリエンスの向上のためにCookieを使用しています。
              </p>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  使用目的
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>ログイン状態の維持</li>
                  <li>ユーザー設定の保存</li>
                  <li>サービス利用状況の分析</li>
                  <li>セキュリティの確保</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. ユーザーの権利
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                ユーザーは自身の個人情報について、以下の権利を有します。
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>個人情報の開示請求</li>
                <li>個人情報の訂正・削除請求</li>
                <li>個人情報の利用停止請求</li>
                <li>アカウントの削除</li>
              </ul>
              <p className="text-gray-700 mt-4 leading-relaxed">
                これらの権利を行使される場合は、お問い合わせフォームよりご連絡ください。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. データの保持期間
              </h2>
              <p className="text-gray-700 leading-relaxed">
                個人情報は、利用目的達成に必要な期間、または法令で定められた期間保持いたします。アカウント削除の場合、一定期間経過後にデータを完全に削除いたします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. 未成年者の利用
              </h2>
              <p className="text-gray-700 leading-relaxed">
                当サービスは18歳未満の方の利用を想定しておりません。18歳未満の方が個人情報を提供された場合、保護者の方からの連絡により速やかに削除いたします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. プライバシーポリシーの変更
              </h2>
              <p className="text-gray-700 leading-relaxed">
                本プライバシーポリシーは、法令の変更やサービスの改善に応じて更新することがあります。重要な変更がある場合は、サービス内またはメールでお知らせいたします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. お問い合わせ
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                本プライバシーポリシーに関するご質問やご意見がございましたら、以下よりお問い合わせください。
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <a
                  href="/contact"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  お問い合わせフォーム
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
