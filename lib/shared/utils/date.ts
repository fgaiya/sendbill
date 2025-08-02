/**
 * 日付関連のユーティリティ関数
 */

/**
 * ISO日付文字列を日本語形式でフォーマット
 * @param dateString ISO形式の日付文字列
 * @returns 日本語形式の日付文字列 (例: 2024/1/15)
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * ISO日付文字列を詳細な日本語形式でフォーマット
 * @param dateString ISO形式の日付文字列
 * @returns 詳細な日本語形式の日付文字列 (例: 2024年1月15日)
 */
export function formatDateLong(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * ISO日付文字列を時刻付きでフォーマット
 * @param dateString ISO形式の日付文字列
 * @returns 時刻付きの日本語形式の日付文字列 (例: 2024/1/15 14:30)
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 相対時間を日本語で表示
 * @param dateString ISO形式の日付文字列
 * @returns 相対時間の文字列 (例: 2時間前, 3日前)
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const target = new Date(dateString);
  const diffInMs = now.getTime() - target.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays}日前`;
  } else if (diffInHours > 0) {
    return `${diffInHours}時間前`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes}分前`;
  } else {
    return 'たった今';
  }
}
