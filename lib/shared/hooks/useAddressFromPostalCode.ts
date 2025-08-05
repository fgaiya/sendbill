import { useState } from 'react';

import { fetchAddressByPostalCode } from '@/lib/shared/utils/postal-code';

import type {
  UseFormSetValue,
  PathValue,
  FieldValues,
  FieldPath,
} from 'react-hook-form';

interface UseAddressFromPostalCodeReturn {
  isFetching: boolean;
  error?: string;
  handleFetchAddress: (postalCode: string) => Promise<void>;
}

export function useAddressFromPostalCode<TFieldValues extends FieldValues>(
  setValue: UseFormSetValue<TFieldValues>,
  fieldNames: {
    prefecture: FieldPath<TFieldValues>;
    city: FieldPath<TFieldValues>;
    street: FieldPath<TFieldValues>;
  }
): UseAddressFromPostalCodeReturn {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string>();

  const handleFetchAddress = async (postalCode: string) => {
    if (!postalCode) return;

    setIsFetching(true);
    setError(undefined);

    try {
      const result = await fetchAddressByPostalCode(postalCode);
      if (result) {
        setValue(
          fieldNames.prefecture,
          result.prefecture as PathValue<TFieldValues, FieldPath<TFieldValues>>
        );
        setValue(
          fieldNames.city,
          result.city as PathValue<TFieldValues, FieldPath<TFieldValues>>
        );
        setValue(
          fieldNames.street,
          result.street as PathValue<TFieldValues, FieldPath<TFieldValues>>
        );
      } else {
        setError('住所が見つかりませんでした');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '住所の取得に失敗しました');
    } finally {
      setIsFetching(false);
    }
  };

  return {
    isFetching,
    error,
    handleFetchAddress,
  };
}
