'use client';

import { useEffect, useRef, useState } from 'react';

import { usePathname } from 'next/navigation';

import {
  onUsageRefresh,
  offUsageRefresh,
} from '@/lib/shared/utils/usage-events';

type Summary = {
  plan: 'FREE' | 'PRO';
  monthlyDocuments: {
    used: number;
    limit: number;
    remaining: number;
    warn: boolean;
  };
};

interface Props {
  onUpgradeClick: () => void;
}

export function UsageIndicator({ onUpgradeClick }: Props) {
  const [data, setData] = useState<Summary>();
  const [_error, setError] = useState<string>();
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  const pathname = usePathname();

  const fetchOnce = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await fetch('/api/billing/usage/summary', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('使用量の取得に失敗しました');
      const json = (await res.json()) as Summary;
      setData(json);
      setError(undefined);
      lastFetchRef.current = Date.now();
    } catch (e) {
      setError(e instanceof Error ? e.message : '使用量の取得に失敗しました');
    } finally {
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    // 初回のみ取得
    void fetchOnce();
  }, []);

  // イベント購読: 作成成功時に即時反映（ヘッダ値があればノーフェッチ）
  useEffect(() => {
    const handler = (detail?: {
      used?: number;
      remaining?: number;
      limit?: number;
      warn?: boolean;
    }) => {
      if (detail && data?.monthlyDocuments) {
        setData({
          plan: data.plan,
          monthlyDocuments: {
            used: detail.used ?? data.monthlyDocuments.used,
            limit: detail.limit ?? data.monthlyDocuments.limit,
            remaining: detail.remaining ?? data.monthlyDocuments.remaining,
            warn: detail.warn ?? data.monthlyDocuments.warn,
          },
        });
      } else {
        void fetchOnce();
      }
    };
    onUsageRefresh(handler);
    return () => offUsageRefresh(handler);
  }, [data]);

  // タブ復帰時は1分以上経っていれば再取得
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastFetchRef.current > 60_000) void fetchOnce();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // ルート遷移時に1回だけ再取得（イベント取りこぼしのセーフティ）
  useEffect(() => {
    if (!pathname) return;
    void fetchOnce();
  }, [pathname]);

  if (!data) return null;

  const doc = data.monthlyDocuments;
  const barWidth = Math.min(
    100,
    Math.round((doc.used / Math.max(1, doc.limit)) * 100)
  );
  const barColor =
    doc.remaining === 0
      ? 'bg-red-500'
      : doc.warn
        ? 'bg-yellow-500'
        : 'bg-blue-600';

  return (
    <div
      className="hidden md:flex items-center gap-4"
      aria-label="使用量インジケーター"
    >
      <div className="flex flex-col items-end">
        <div className="text-xs text-gray-600">プラン: {data.plan}</div>
        <button
          onClick={onUpgradeClick}
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          {data.plan === 'PRO' ? 'プラン管理' : 'アップグレード'}
        </button>
      </div>
      <div className="w-44">
        <div className="text-xs text-gray-700">
          今月の作成 {doc.used}/{doc.limit}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded">
          <div
            className={`h-2 rounded ${barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
