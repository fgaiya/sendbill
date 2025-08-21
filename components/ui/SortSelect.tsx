interface SortOption<T = string> {
  value: T;
  label: string;
}

interface SortSelectProps<T = string> {
  options: readonly SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

/**
 * ソート選択セレクト共通コンポーネント
 *
 * @param options - ソートオプション配列
 * @param value - 現在の選択値
 * @param onChange - 値変更時のコールバック
 * @param label - ラベルテキスト
 */
export function SortSelect<T = string>({
  options,
  value,
  onChange,
  label = '並び順:',
}: SortSelectProps<T>) {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value as string}
        onChange={(e) => onChange(e.target.value as T)}
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
