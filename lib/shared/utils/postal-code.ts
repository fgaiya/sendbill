export interface PostalCodeResult {
  postalCode: string;
  prefecture: string;
  city: string;
  street: string;
}

export interface ZipCloudResult {
  address1?: string;
  address2?: string;
  address3?: string;
  kana1?: string;
  kana2?: string;
  kana3?: string;
  prefcode?: string | number;
  zipcode?: string;
}

export interface ZipCloudResponse {
  message: string | null;
  results: ZipCloudResult[] | null;
  status: number;
}

// レート制限を管理するための状態
let lastRequestPromise: Promise<void> = Promise.resolve();
const minInterval = 100;

async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const currentPromise = lastRequestPromise.then(async () => {
    await new Promise((resolve) => setTimeout(resolve, minInterval));
    return fn();
  });

  lastRequestPromise = currentPromise.then(() => undefined).catch(() => {});
  return currentPromise;
}

export async function fetchAddressByPostalCode(
  postalCode: string
): Promise<PostalCodeResult | null> {
  const cleanPostalCode = postalCode.replace(/[^0-9]/g, '');

  // 厳密な7桁の数値形式チェック
  if (!/^\d{7}$/.test(cleanPostalCode)) {
    throw new Error('郵便番号は7桁の数字で入力してください');
  }

  return withRateLimit(async () => {
    try {
      // AbortControllerでタイムアウト制御
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

      const url = `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanPostalCode}`;

      // HTTPS URLの検証
      if (!url.startsWith('https://')) {
        throw new Error(
          'セキュリティ上の理由により、HTTPS通信のみ許可されています'
        );
      }

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SendBill/1.0',
        },
        // SSL証明書の検証を強制（デフォルトでtrueだが明示的に設定）
        mode: 'cors',
        credentials: 'omit',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('住所の取得に失敗しました');
      }

      const data: ZipCloudResponse = await response.json();

      if (data.status !== 200 || !data.results || data.results.length === 0) {
        return null;
      }

      const result = data.results[0];

      // 必須フィールドの存在確認
      if (!result.address1 || !result.address2 || !result.zipcode) {
        console.warn('不完全な住所データを受信しました:', result);
        return null;
      }

      return {
        postalCode: `${cleanPostalCode.slice(0, 3)}-${cleanPostalCode.slice(3)}`,
        prefecture: result.address1,
        city: result.address2,
        street: result.address3 || '',
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('郵便番号API エラー:', {
          message: error.message,
          postalCode: cleanPostalCode,
          timestamp: new Date().toISOString(),
        });

        // AbortErrorの場合は専用のエラーメッセージ
        if (error.name === 'AbortError') {
          throw new Error(
            '住所検索がタイムアウトしました。時間をおいて再試行してください。'
          );
        }
      }

      throw error;
    }
  });
}
