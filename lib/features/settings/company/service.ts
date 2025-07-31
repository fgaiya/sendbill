import { CompanyFormData, Company } from './types';

export async function getCompany(): Promise<Company | null> {
  try {
    const response = await fetch('/api/companies');
    if (response.ok) {
      const companies = await response.json();
      if (companies.length > 0) {
        return companies[0];
      }
    }
    return null;
  } catch (error) {
    console.error('Company fetch error:', error);
    throw new Error('会社情報の取得に失敗しました');
  }
}

export async function createCompany(data: CompanyFormData): Promise<Company> {
  try {
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '会社情報の作成に失敗しました');
    }

    return await response.json();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '会社情報の作成中にエラーが発生しました';
    throw new Error(message);
  }
}

export async function updateCompany(
  id: string,
  data: CompanyFormData
): Promise<Company> {
  try {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '会社情報の更新に失敗しました');
    }

    return await response.json();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '会社情報の更新中にエラーが発生しました';
    throw new Error(message);
  }
}
