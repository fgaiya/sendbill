'use client';

import { FileText, Receipt } from 'lucide-react';

import type { DocumentType } from '@/lib/domains/documents/types';
import { cn } from '@/lib/shared/utils/ui';

interface DocumentTypeTabProps {
  currentType: DocumentType | 'all';
  onTypeChange: (type: DocumentType | 'all') => void;
  summary: {
    quotesCount: number;
    invoicesCount: number;
    totalCount: number;
  };
}

export function DocumentTypeTab({
  currentType,
  onTypeChange,
  summary,
}: DocumentTypeTabProps) {
  const tabs = [
    {
      key: 'all' as const,
      label: 'すべて',
      count: summary.totalCount,
      icon: null,
    },
    {
      key: 'quote' as const,
      label: '見積書',
      count: summary.quotesCount,
      icon: FileText,
    },
    {
      key: 'invoice' as const,
      label: '請求書',
      count: summary.invoicesCount,
      icon: Receipt,
    },
  ];

  return (
    <div className="flex space-x-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentType === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onTypeChange(tab.key)}
            className={cn(
              'relative flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              isActive
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="flex items-center space-x-2">
              {Icon && <Icon className="h-4 w-4" />}
              <span>{tab.label}</span>
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  isActive
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                )}
              >
                {tab.count}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
