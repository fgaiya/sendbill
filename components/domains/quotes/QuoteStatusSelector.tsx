'use client';

import { useState, useRef, useEffect } from 'react';

import {
  ChevronDown,
  Check,
  Clock,
  Send,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { Quote, QuoteStatus } from '@/lib/domains/quotes/types';
import { cn } from '@/lib/shared/utils/ui';

import { QuoteStatusBadge } from './QuoteStatusBadge';

interface QuoteStatusSelectorProps {
  quote: Quote;
  onStatusChange: (quoteId: string, newStatus: QuoteStatus) => Promise<void>;
  className?: string;
}

const statusOptions: {
  value: QuoteStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    value: 'DRAFT',
    label: '下書き',
    description: '作成中の見積書',
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
    value: 'ACCEPTED',
    label: '承認',
    description: '取引先が承認',
    icon: ThumbsUp,
    color: 'text-green-600',
  },
  {
    value: 'DECLINED',
    label: '却下',
    description: '取引先が却下',
    icon: ThumbsDown,
    color: 'text-red-600',
  },
];

export function QuoteStatusSelector({
  quote,
  onStatusChange,
  className,
}: QuoteStatusSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ドロップダウンの位置を計算
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: 256, // w-64の値
      });
    }
  };

  // クリックアウトサイドでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    const handleScroll = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    };

    if (showDropdown) {
      updateDropdownPosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showDropdown]);

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    if (newStatus === quote.status) return;

    setIsUpdating(true);
    setShowDropdown(false);

    try {
      await onStatusChange(quote.id, newStatus);
      const selectedOption = statusOptions.find((s) => s.value === newStatus);
      toast.success(`ステータスを「${selectedOption?.label}」に変更しました`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'ステータスの変更に失敗しました';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderDropdown = () => {
    if (!showDropdown) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        className="absolute bg-white rounded-lg shadow-xl z-[9999] border border-gray-200 animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
      >
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            ステータス変更
          </div>
        </div>
        <div className="py-1 flex flex-col">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = option.value === quote.status;

            return (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={isUpdating || isSelected}
                className={cn(
                  'w-full text-left px-3 py-3 text-sm transition-colors duration-150 block',
                  'hover:bg-gray-50 disabled:cursor-not-allowed',
                  isSelected
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:border-l-4 hover:border-l-transparent',
                  isUpdating && 'opacity-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-4 w-4', option.color)} />
                    <div>
                      <div
                        className={cn(
                          'font-medium',
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        )}
                      >
                        {option.label}
                      </div>
                      <div
                        className={cn(
                          'text-xs mt-0.5',
                          isSelected ? 'text-blue-600' : 'text-gray-500'
                        )}
                      >
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <Button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isUpdating}
        variant="ghost"
        size="sm"
        className="p-1 h-auto hover:bg-gray-50 rounded-md group"
      >
        <div className="flex items-center gap-1">
          <QuoteStatusBadge
            status={quote.status}
            className={cn(
              'transition-all duration-200',
              isUpdating && 'opacity-50',
              'group-hover:shadow-sm'
            )}
          />
          <ChevronDown
            className={cn(
              'h-3 w-3 text-gray-400 transition-transform duration-200',
              showDropdown && 'rotate-180'
            )}
          />
        </div>
      </Button>

      {renderDropdown()}
    </div>
  );
}
