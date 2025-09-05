// クライアントサイドの使用量更新イベントユーティリティ
// 作成後に使用量更新をブロードキャストするためのCustomEventを使用

export const USAGE_REFRESH_EVENT = 'sb:usage:refresh';

export interface UsageRefreshDetail {
  used?: number; // 現在の期間での使用数
  remaining?: number; // 現在の期間での残りアクション数
  limit?: number; // プラン上限（純粋な上限）
  warn?: boolean;
}

export type UsageRefreshHandler = (detail?: UsageRefreshDetail) => void;

export function emitUsageRefresh(detail?: UsageRefreshDetail) {
  if (typeof window === 'undefined') return;
  const ev = new CustomEvent<UsageRefreshDetail>(USAGE_REFRESH_EVENT, {
    detail,
  });
  window.dispatchEvent(ev);
}

export function onUsageRefresh(handler: UsageRefreshHandler) {
  if (typeof window === 'undefined') return;
  const wrapped = (e: Event) => {
    const ce = e as CustomEvent<UsageRefreshDetail>;
    handler(ce.detail);
  };
  // off用のハンドラー参照をアタッチ
  // @ts-expect-error attach for removal
  handler.__wrapped = wrapped;
  window.addEventListener(USAGE_REFRESH_EVENT, wrapped as EventListener);
}

export function offUsageRefresh(handler: UsageRefreshHandler) {
  if (typeof window === 'undefined') return;
  // @ts-expect-error retrieve wrapper
  const wrapped = handler.__wrapped as EventListener | undefined;
  if (wrapped) window.removeEventListener(USAGE_REFRESH_EVENT, wrapped);
}
