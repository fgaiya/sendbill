/**
 * 共通ソート型定義
 */

export type SortDirection = 'asc' | 'desc';

export type SortField<T extends string> = `${T}_${SortDirection}`;

export interface SortParams<T extends string> {
  sort?: SortField<T>;
}
