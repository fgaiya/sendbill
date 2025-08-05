export function formatPhoneNumber(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const cleaned = value.replace(/[^0-9]/g, '');

  if (cleaned.length === 0) return '';

  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  } else if (cleaned.length <= 11) {
    // 携帯電話 (090, 080, 070で始まる11桁)
    if (
      (cleaned.startsWith('090') ||
        cleaned.startsWith('080') ||
        cleaned.startsWith('070')) &&
      cleaned.length === 11
    ) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    // 固定電話 (0で始まる10桁)
    else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    // その他の場合
    else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
  }

  // 11桁を超える場合は切り捨ててからフォーマット
  return formatPhoneNumber(cleaned.slice(0, 11));
}
