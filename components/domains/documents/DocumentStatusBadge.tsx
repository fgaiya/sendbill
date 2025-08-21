'use client';

import {
  Clock,
  Send,
  Check,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
} from 'lucide-react';

import type { Document } from '@/lib/domains/documents/types';
import { isQuote, isInvoice } from '@/lib/domains/documents/types';
import { cn } from '@/lib/shared/utils/ui';

interface DocumentStatusBadgeProps {
  document: Document;
  onRefresh?: () => Promise<void>;
  className?: string;
}

// 見積書ステータス設定
const quoteStatusConfig = {
  DRAFT: {
    label: '下書き',
    icon: Clock,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  SENT: {
    label: '送信済み',
    icon: Send,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  ACCEPTED: {
    label: '承認済み',
    icon: ThumbsUp,
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  DECLINED: {
    label: '却下',
    icon: ThumbsDown,
    className: 'bg-red-100 text-red-700 border-red-200',
  },
} as const;

// 請求書ステータス設定
const invoiceStatusConfig = {
  DRAFT: {
    label: '下書き',
    icon: Clock,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  SENT: {
    label: '送信済み',
    icon: Send,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  PAID: {
    label: '支払済み',
    icon: Check,
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  OVERDUE: {
    label: '期限超過',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700 border-red-200',
  },
} as const;

export function DocumentStatusBadge({
  document,
  onRefresh: _onRefresh,
  className,
}: DocumentStatusBadgeProps) {
  const getStatusConfig = () => {
    if (isQuote(document)) {
      const status = document.status as keyof typeof quoteStatusConfig;
      return (
        quoteStatusConfig[status] || {
          label: document.status,
          icon: Clock,
          className: 'bg-gray-100 text-gray-700 border-gray-200',
        }
      );
    }

    if (isInvoice(document)) {
      const status = document.status as keyof typeof invoiceStatusConfig;
      return (
        invoiceStatusConfig[status] || {
          label: document.status,
          icon: Clock,
          className: 'bg-gray-100 text-gray-700 border-gray-200',
        }
      );
    }

    // フォールバック
    return {
      label: 'unknown',
      icon: Clock,
      className: 'bg-gray-100 text-gray-700 border-gray-200',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
}
