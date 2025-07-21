/**
 * Application Configuration
 *
 * アプリケーション全体で使用するUI設定値を一元管理する
 * ハードコードされた値をここに集約し、デザインシステムの一貫性を保つ
 */

export const APP_CONFIG = {
  UI: {
    SIDEBAR: {
      // サイドバー幅設定
      COLLAPSED_WIDTH: 'w-16',
      EXPANDED_WIDTH: 'w-64',
      // サイドバー対応マージン設定
      COLLAPSED_MARGIN: 'lg:ml-16',
      EXPANDED_MARGIN: 'lg:ml-64',
    },
    LAYOUT: {
      // コンテナ最大幅
      CONTAINER_MAX_WIDTH: 'max-w-7xl',
      // 共通パディング設定
      CONTENT_PADDING: 'py-6 sm:px-6 lg:px-8',
      DASHBOARD_PADDING: 'px-4 py-6 sm:px-0',
      CONTENT_INNER_PADDING: 'p-6',
    },
    BUTTON: {
      // CTAボタン基本クラス
      CTA_BASE:
        'flex items-center justify-center rounded-md px-8 py-3 text-base font-medium transition-colors',
      // CTAボタンレスポンシブ対応
      CTA_RESPONSIVE: 'md:py-4 md:px-10 md:text-lg',
      // プライマリボタン
      PRIMARY:
        'border border-transparent bg-blue-600 text-white hover:bg-blue-700',
      // セカンダリボタン
      SECONDARY:
        'border border-blue-600 bg-white text-blue-600 hover:bg-blue-50',
      // 通常のボタンスタイル
      REGULAR_PRIMARY:
        'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors',
      REGULAR_SECONDARY:
        'text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors',
      // 共通ボーダー半径
      BORDER_RADIUS: 'rounded-md',
    },
    SPACING: {
      // コンポーネント間の間隔
      COMPONENT_GAP: 'ml-3',
      // アイコンサイズ
      ICON_SIZE: 'w-6 h-6',
    },
    COLORS: {
      // ナビゲーションアクティブ状態
      NAV_ACTIVE: 'bg-blue-50 text-blue-700 border-r-2 border-blue-700',
      NAV_INACTIVE: 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
      // サイドバーアクティブ状態
      SIDEBAR_ACTIVE: 'bg-blue-50 text-blue-700 border-r-2 border-blue-700',
      SIDEBAR_INACTIVE: 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
    },
    FOCUS: {
      // フォーカスリング
      RING: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    },
  },
  ANIMATION: {
    // アニメーション持続時間（ミリ秒）
    DURATION: 300,
    // クリーンアップ遅延（ミリ秒）
    CLEANUP_DELAY: 1000,
    // トランジションクラス
    TRANSITION_ALL: 'transition-all duration-300 ease-in-out',
    TRANSITION_COLORS: 'transition-colors',
    TRANSITION_OPACITY: 'transition-opacity duration-300',
  },
  BREAKPOINTS: {
    // サイドバー表示ブレークポイント
    SIDEBAR_VISIBLE: 'lg', // 1024px以上
  },
} as const;

// 型安全性のための型エクスポート
export type AppConfig = typeof APP_CONFIG;
