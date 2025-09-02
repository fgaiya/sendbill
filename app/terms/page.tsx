import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 | SendBill',
  description: 'SendBillサービスの利用規約・利用条件',
};

export default function TermsPage() {
  const lastUpdated = '2025年9月1日';

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            利用規約
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            SendBillサービスの利用条件について
          </p>
          <p className="mt-2 text-sm text-gray-500">
            最終更新日: {lastUpdated}
          </p>
        </div>

        <div className="prose max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第1条（適用）
              </h2>
              <p className="text-gray-700 leading-relaxed">
                本規約は、SendBill（以下「当サービス」）の利用条件を定めるものです。ユーザーは、本サービスを利用することにより、本規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第2条（定義）
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                本規約において、以下の用語は次の意味を有します。
              </p>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-900">
                    「サービス」
                  </span>
                  <span className="text-gray-700">
                    ：SendBillが提供する請求書管理サービス
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    「ユーザー」
                  </span>
                  <span className="text-gray-700">
                    ：本サービスを利用するすべての個人・法人
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    「コンテンツ」
                  </span>
                  <span className="text-gray-700">
                    ：文章、画像、動画等の情報
                  </span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第3条（アカウント登録）
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  ユーザーは、本サービスを利用するにあたり、正確で最新の情報を提供してアカウント登録を行う必要があります。
                </p>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    登録条件
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>18歳以上であること</li>
                    <li>虚偽の情報を提供しないこと</li>
                    <li>他人になりすましを行わないこと</li>
                    <li>本規約および関連法令を遵守すること</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第4条（サービスの利用）
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  ユーザーは、本サービスを本規約に従って適切に利用するものとします。
                </p>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    主な機能
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>請求書・見積書の作成・編集・管理</li>
                    <li>顧客情報の管理</li>
                    <li>帳票のPDF出力・ダウンロード</li>
                    <li>売上・入金管理</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第5条（禁止行為）
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                ユーザーは、以下の行為を行ってはならないものとします。
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>法令または本規約に違反する行為</li>
                <li>公序良俗に反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>
                  サーバーやネットワークの機能を破壊し、または妨害する行為
                </li>
                <li>不正アクセスやコンピューターウイルスの配布等の行為</li>
                <li>他のユーザーの個人情報等を収集または蓄積する行為</li>
                <li>他のユーザーに成りすます行為</li>
                <li>営業、宣伝、広告、勧誘等を目的とする行為</li>
                <li>面識のない異性との出会いや交際を目的とする行為</li>
                <li>反社会的勢力に対する利益供与その他の協力行為</li>
                <li>その他、当サービスが不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第6条（知的財産権）
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  本サービスに関する知的財産権は、当サービスまたは正当な権利者に帰属します。
                </p>
                <p className="leading-relaxed">
                  ユーザーが本サービスに投稿したコンテンツの知的財産権は、ユーザーに留保されますが、当サービスはサービス提供に必要な範囲で、これを利用することができるものとします。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第7条（料金・支払い）
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  本サービスは現在、基本機能を無料で提供しています。将来的に有料プランを導入する場合は、事前にユーザーに通知いたします。
                </p>
                <p className="leading-relaxed">
                  有料プランを利用する場合、ユーザーは指定された方法により料金を支払うものとします。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第8条（サービスの変更・中断・終了）
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  当サービスは、ユーザーへの事前通知なしに、本サービスの内容を変更し、または本サービスの提供を中断、終了することができるものとします。
                </p>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    サービス中断・終了の理由
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>システムメンテナンスの実施</li>
                    <li>コンピュータ、通信回線等の障害</li>
                    <li>地震、落雷、火災、停電、天災などの不可抗力</li>
                    <li>その他、運営上または技術上の理由</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第9条（データのバックアップ・保存）
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  当サービスは、ユーザーデータの安全な保存に努めますが、データの消失等に対する完全な保証はいたしません。
                </p>
                <p className="leading-relaxed">
                  ユーザーは、重要なデータについては定期的にバックアップを作成することを推奨いたします。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第10条（免責事項）
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  当サービスは、本サービスの内容や、ユーザーが本サービスを通じて得る情報等について、その正確性、有用性、最新性、適法性等、いかなる保証も行いません。
                </p>
                <p className="leading-relaxed">
                  当サービスは、本サービスに起因してユーザーに生じたいかなる損害についても、一切の責任を負いません。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第11条（利用規約の変更）
              </h2>
              <p className="text-gray-700 leading-relaxed">
                当サービスは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の規約は、本サービス上に表示された時点より効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第12条（準拠法・管轄裁判所）
              </h2>
              <p className="text-gray-700 leading-relaxed">
                本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、東京地方裁判所を専属的合意管轄とします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                第13条（お問い合わせ）
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                本規約に関するご質問やご意見がございましたら、以下よりお問い合わせください。
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

            <div className="border-t border-gray-200 pt-8 mt-12">
              <p className="text-center text-gray-500 text-sm">
                制定日: 2025年8月31日
                <br />
                最終改定日: {lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
