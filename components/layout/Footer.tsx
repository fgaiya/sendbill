import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ブランド・説明 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">SendBill</h3>
            <p className="text-gray-600 text-sm">
              請求書管理をシンプルに。効率的な請求書作成・管理・送信プラットフォーム。
            </p>
          </div>

          {/* サービス */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              サービス
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/invoices" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  請求書作成
                </Link>
              </li>
              <li>
                <Link href="/quotes" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  見積書作成
                </Link>
              </li>
              <li>
                <Link href="/clients" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  クライアント管理
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  ダッシュボード
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              サポート
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  ヘルプ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  利用規約
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            © {currentYear} SendBill. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}