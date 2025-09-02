import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ヘルプ | SendBill',
  description: 'SendBillの使い方やよくある質問について',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ヘルプセンター
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            SendBillの使い方やよくある質問をご確認いただけます
          </p>
        </div>

        <div className="space-y-12">
          {/* 基本的な使い方 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              基本的な使い方
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  1. アカウント作成
                </h3>
                <p className="text-gray-600">
                  右上の「新規登録」ボタンからアカウントを作成し、メールアドレスの確認を行ってください。
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  2. 会社情報の設定
                </h3>
                <p className="text-gray-600">
                  ダッシュボードの「会社設定」から、請求書に表示される会社情報を登録してください。
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  3. 顧客情報の登録
                </h3>
                <p className="text-gray-600">
                  「顧客管理」から取引先の情報を登録し、請求書作成時に選択できるようにしましょう。
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  4. 請求書・見積書の作成
                </h3>
                <p className="text-gray-600">
                  「帳票管理」から見積書や請求書を作成し、PDFでダウンロードできます。
                </p>
              </div>
            </div>
          </section>

          {/* よくある質問 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              よくある質問
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 bg-blue-50 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Q. 請求書の番号は自動で採番されますか？
                </h3>
                <p className="text-gray-700">
                  A.
                  はい、請求書を「送信」状態に変更した際に、会社ごとに連番で自動採番されます。下書き状態では番号は付与されません。
                </p>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Q. 消費税の計算方法はどうなっていますか？
                </h3>
                <p className="text-gray-700">
                  A.
                  各行ごとに税額を計算し、税率別に合計する方式を採用しています。軽減税率にも対応しており、品目ごとに税率を設定できます。
                </p>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Q. 見積書から請求書への変換はできますか？
                </h3>
                <p className="text-gray-700">
                  A.
                  はい、承認された見積書から請求書を作成することができます。品目情報は自動的に引き継がれます。
                </p>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Q. データのバックアップはどうなっていますか？
                </h3>
                <p className="text-gray-700">
                  A.
                  すべてのデータはクラウド上で安全に保管され、定期的にバックアップされています。また、データは暗号化されており、セキュリティ対策も万全です。
                </p>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Q. 複数のユーザーで利用することはできますか？
                </h3>
                <p className="text-gray-700">
                  A.
                  現在は個人事業主・小規模企業向けのサービスとして、1アカウント1ユーザーでの利用を想定しています。
                </p>
              </div>
            </div>
          </section>

          {/* トラブルシューティング */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              トラブルシューティング
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-yellow-800 mb-4">
                問題が解決しない場合
              </h3>
              <p className="text-yellow-700 mb-4">
                上記の情報で問題が解決しない場合は、お気軽にお問い合わせください。
              </p>
              <a
                href="/contact"
                className="inline-flex items-center px-4 py-2 border border-yellow-300 rounded-md text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 transition-colors"
              >
                お問い合わせはこちら
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
