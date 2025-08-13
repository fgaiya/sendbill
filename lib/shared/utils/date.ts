/**
 * 日付関連のユーティリティ関数
 */

/**
 * ISO日付文字列を日本語形式でフォーマット
 * @param dateString ISO形式の日付文字列
 * @returns 日本語形式の日付文字列 (例: 2024/1/15) または不正な日付の場合はnull
 */
export function formatDate(dateString: string): string | null {
  if (!isValidDateString(dateString)) {
    return null;
  }

  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * ISO日付文字列を詳細な日本語形式でフォーマット
 * @param dateString ISO形式の日付文字列
 * @returns 詳細な日本語形式の日付文字列 (例: 2024年1月15日) または不正な日付の場合はnull
 */
export function formatDateLong(dateString: string): string | null {
  if (!isValidDateString(dateString)) {
    return null;
  }

  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * ISO日付文字列を時刻付きでフォーマット
 * @param dateString ISO形式の日付文字列
 * @returns 時刻付きの日本語形式の日付文字列 (例: 2024/1/15 14:30) または不正な日付の場合はnull
 */
export function formatDateTime(dateString: string): string | null {
  if (!isValidDateString(dateString)) {
    return null;
  }

  return new Date(dateString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 日付文字列が有効かどうかを判定
 * @param dateString 日付文字列
 * @returns 有効な日付の場合true、無効な場合false
 */
function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * 相対時間を日本語で表示
 * @param dateString ISO形式の日付文字列
 * @returns 相対時間の文字列 (例: 2時間前, 3日前) または不正な日付の場合はnull
 */
export function formatRelativeTime(dateString: string): string | null {
  if (!isValidDateString(dateString)) {
    return null;
  }

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

/**
 * 日付を <input type="date"> 用の "YYYY-MM-DD" にローカルタイムで変換
 * タイムゾーンのずれを考慮してローカル日付を正しく表示
 * @param date Dateオブジェクト
 * @returns "YYYY-MM-DD" 形式の文字列、または無効な日付の場合は空文字列
 */
export function toDateInputValue(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    // input 要素の「空」を表現
    return '';
  }
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60_000);
  return local.toISOString().slice(0, 10);
}

/**
 * "YYYY-MM-DD" をローカルタイムの Date に変換
 * input type="date" からの値を正しいローカル日付に変換
 * 不正日付（2024-02-31など）は自動補正せずにundefinedを返す
 * @param value "YYYY-MM-DD" 形式の文字列
 * @returns ローカルタイムのDateオブジェクト、または不正/空の場合undefined
 */
export function fromDateInputValue(value: string): Date | undefined {
  const v = value?.trim();
  if (!v) return undefined;

  // 厳密な "YYYY-MM-DD" フォーマットチェック
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return undefined;

  const y = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);

  const date = new Date(y, mm - 1, dd);

  // ラウンドトリップ検証（自動補正を検出）
  // 例: 2024-02-31 → 2024-03-02 になる場合は不正として弾く
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) {
    return undefined;
  }

  return date;
}

/**
 * 日付をAPI送信用の"YYYY-MM-DD"文字列に変換
 * タイムゾーンのずれを考慮してローカル日付を正しくAPI送信
 * @param date Dateオブジェクト
 * @returns "YYYY-MM-DD" 形式の文字列、または無効な日付の場合はnull
 */
export function toApiDateString(date: Date | null | undefined): string | null {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  return toDateInputValue(date); // 既存のtoDateInputValueを再利用
}
