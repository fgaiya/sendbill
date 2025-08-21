'use client';

import { Clock, Send, Check, AlertTriangle } from 'lucide-react';

import type { InvoiceStatus } from '@/lib/domains/invoices/types';
import { cn } from '@/lib/shared/utils/ui';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
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
};

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
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
