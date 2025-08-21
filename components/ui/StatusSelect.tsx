interface StatusOption<T = string> {
  value: T | '';
  label: string;
}

interface StatusSelectProps<T = string> {
  options: readonly StatusOption<T>[];
  value?: T;
  onChange: (value: T | undefined) => void;
  label?: string;
}

/**
 * ステータス選択セレクト共通コンポーネント
 *
 * @param options - ステータスオプション配列
 * @param value - 現在の選択値（undefinedは全選択）
 * @param onChange - 値変更時のコールバック
 * @param label - ラベルテキスト
 */
export function StatusSelect<T = string>({
  options,
  value,
  onChange,
  label = 'ステータス:',
}: StatusSelectProps<T>) {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={(value as string) || ''}
        onChange={(e) => onChange((e.target.value as T) || undefined)}
        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option.value as string} value={option.value as string}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
