import { Clock, Send, ThumbsUp, ThumbsDown, FileCheck } from 'lucide-react';

import { type QuoteStatus } from '@/lib/domains/quotes/types';
import { cn } from '@/lib/shared/utils/ui';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  DRAFT: {
    label: '下書き',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Clock,
  },
  SENT: {
    label: '送信済み',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Send,
  },
  ACCEPTED: {
    label: '承認',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: ThumbsUp,
  },
  DECLINED: {
    label: '却下',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: ThumbsDown,
  },
  INVOICED: {
    label: '請求書作成済み',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: FileCheck,
  },
} as const;

export function QuoteStatusBadge({
  status,
  showIcon = false,
  className,
}: QuoteStatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) {
    // フォールバック用のデフォルト設定
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200',
          'bg-gray-100 text-gray-800 border-gray-200',
          className
        )}
      >
        不明なステータス
      </span>
    );
  }
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
