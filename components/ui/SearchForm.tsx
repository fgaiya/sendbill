'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/shared/utils/ui';

interface SearchFormProps {
  placeholder: string;
  onSubmit: (query: string) => void;
  className?: string;
}

/**
 * 検索フォーム共通コンポーネント
 *
 * @param placeholder - 検索ボックスのプレースホルダー
 * @param onSubmit - 検索実行時のコールバック
 * @param className - 追加のCSSクラス
 */
export function SearchForm({
  placeholder,
  onSubmit,
  className,
}: SearchFormProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(query);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('flex space-x-2', className)}>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-64"
      />
      <Button type="submit" variant="outline">
        検索
      </Button>
    </form>
  );
}
