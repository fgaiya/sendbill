'use client';

import { useState } from 'react';

import { ChevronDown, Clock, Send, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { InvoiceStatus } from '@/lib/domains/invoices/types';
import { cn } from '@/lib/shared/utils/ui';

import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoiceStatusSelectorProps {
  invoiceId: string;
  currentStatus: InvoiceStatus;
  onStatusChange: (
    invoiceId: string,
    newStatus: InvoiceStatus
  ) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const statusOptions: {
  value: InvoiceStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    value: 'DRAFT',
    label: '下書き',
    description: '作成中の請求書',
    icon: Clock,
    color: 'text-gray-600',
  },
  {
    value: 'SENT',
    label: '送信済み',
    description: '取引先に送信済み',
    icon: Send,
    color: 'text-blue-600',
  },
  {
    value: 'PAID',
    label: '支払済み',
    description: '支払いが完了',
    icon: Check,
    color: 'text-green-600',
  },
  {
    value: 'OVERDUE',
    label: '期限超過',
    description: '支払期限を過ぎています',
    icon: AlertTriangle,
    color: 'text-red-600',
  },
];

export function InvoiceStatusSelector({
  invoiceId,
  currentStatus,
  onStatusChange,
  disabled = false,
  className,
}: InvoiceStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    if (newStatus === currentStatus || isLoading) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await onStatusChange(invoiceId, newStatus);
      toast.success(
        `ステータスを「${getStatusLabel(newStatus)}」に変更しました`
      );
      setIsOpen(false);
    } catch (error) {
      toast.error('ステータスの変更に失敗しました');
      console.error('Status change failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: InvoiceStatus): string => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.label || status;
  };

  // 変更可能なステータス遷移ルール
  const getAvailableStatuses = (current: InvoiceStatus): InvoiceStatus[] => {
    switch (current) {
      case 'DRAFT':
        return ['SENT'];
      case 'SENT':
        return ['PAID', 'OVERDUE'];
      case 'PAID':
        return []; // 支払済みは最終状態
      case 'OVERDUE':
        return ['PAID'];
      default:
        return [];
    }
  };

  const availableStatuses = getAvailableStatuses(currentStatus);
  const canChange = availableStatuses.length > 0 && !disabled;

  if (!canChange) {
    return <InvoiceStatusBadge status={currentStatus} />;
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="h-auto p-1 hover:bg-gray-50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-1">
          <InvoiceStatusBadge status={currentStatus} />
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </div>
      </Button>

      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* ドロップダウンメニュー */}
          <div className="absolute top-full left-0 z-20 mt-1 min-w-[200px] bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="listbox">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                現在: {getStatusLabel(currentStatus)}
              </div>

              {availableStatuses.map((status) => {
                const option = statusOptions.find(
                  (opt) => opt.value === status
                );
                if (!option) return null;

                const Icon = option.icon;

                return (
                  <button
                    key={status}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                    onClick={() => handleStatusChange(status)}
                    role="option"
                    aria-selected={status === currentStatus}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={cn('h-4 w-4', option.color)} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
