/**
 * localStorage が利用可能かどうかをチェックするヘルパー関数
 * SSR環境やプライベートブラウジングモードなどでlocalStorageが利用できない場合を考慮
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__storage_availability_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * 安全にlocalStorageから値を取得する関数
 */
export const getStorageItem = (key: string): string | null => {
  if (!isLocalStorageAvailable()) return null
  
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.warn(`Failed to get item from localStorage for key "${key}":`, error)
    return null
  }
}

/**
 * 安全にlocalStorageに値を設定する関数
 */
export const setStorageItem = (key: string, value: string): boolean => {
  if (!isLocalStorageAvailable()) return false
  
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.warn(`Failed to set item in localStorage for key "${key}":`, error)
    return false
  }
}

/**
 * 安全にlocalStorageから値を削除する関数
 */
export const removeStorageItem = (key: string): boolean => {
  if (!isLocalStorageAvailable()) return false
  
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.warn(`Failed to remove item from localStorage for key "${key}":`, error)
    return false
  }
}