'use client';

import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { emitUsageRefresh } from '@/lib/shared/utils/usage-events';

type Plan = 'FREE' | 'PRO';

export function UpgradeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [plan, setPlan] = useState<Plan>('FREE');

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch('/api/billing/usage/summary', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.plan === 'PRO' || json?.plan === 'FREE') setPlan(json.plan);
        } else {
          console.warn('プラン情報の取得に失敗しました:', res.status);
        }
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.warn('プラン情報の取得でエラーが発生しました:', e.message);
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [isOpen]);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      if (!res.ok) {
        let msg = 'Checkoutの作成に失敗しました';
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }
      const data = (await res.json()) as { url?: string };
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout URLを取得できませんでした');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const res = await fetch('/api/billing/cancel', { method: 'POST' });
      if (!res.ok) {
        let msg = 'キャンセルに失敗しました';
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }
      setPlan('FREE');
      // 即時反映のため、usage再取得をイベントで促す
      emitUsageRefresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan === 'PRO' ? 'プランの管理' : 'プランのアップグレード'}
      description={
        plan === 'PRO'
          ? 'キャンセルすると直ちにFreeプランへ切り替わります。'
          : '上限に達した場合はProプランにアップグレードできます。'
      }
    >
      <div className="space-y-4">
        {plan === 'FREE' ? (
          <p className="text-sm text-gray-700">
            Proプランでは、今月の帳票作成上限が大幅に増加します。
          </p>
        ) : (
          <p className="text-sm text-gray-700">
            サブスクリプションのキャンセルはいつでも可能です。
          </p>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            閉じる
          </button>
          {plan === 'FREE' ? (
            <button
              onClick={handleUpgrade}
              className={`px-4 py-2 text-sm rounded text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={loading}
            >
              {loading ? '処理中...' : 'Checkoutへ'}
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className={`px-4 py-2 text-sm rounded text-white ${loading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}
              disabled={loading}
            >
              {loading ? '処理中...' : 'サブスクをキャンセル'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
