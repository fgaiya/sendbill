import { validateDiscountAgainstTotal } from '@/lib/domains/quotes/validation';

describe('validateDiscountAgainstTotal', () => {
  const existing = { unitPrice: 100, quantity: 2 }; // total = 200

  test('部分更新: discountAmount だけ超過 → エラー', () => {
    expect(() =>
      validateDiscountAgainstTotal(existing, { discountAmount: 300 })
    ).toThrow('割引額は品目合計金額を超えることはできません');
  });

  test('部分更新: discountAmount だけ境界値（等しい）→ OK', () => {
    expect(() =>
      validateDiscountAgainstTotal(existing, { discountAmount: 200 })
    ).not.toThrow();
  });

  test('すべて指定: 合計が増える場合でも超過でなければ OK', () => {
    expect(() =>
      validateDiscountAgainstTotal(existing, {
        unitPrice: 150, // total -> 300
        quantity: 2,
        discountAmount: 200,
      })
    ).not.toThrow();
  });

  test('部分更新: quantity を下げて discount 既存超過になる → エラー', () => {
    // 既存 discount は関知しないが、パッチ指定の discount があれば比較対象
    expect(() =>
      validateDiscountAgainstTotal(
        { unitPrice: 100, quantity: 2 },
        { quantity: 1, discountAmount: 150 } // total -> 100, discount 150 > 100
      )
    ).toThrow('割引額は品目合計金額を超えることはできません');
  });

  test('部分更新: discount 未指定 → OK', () => {
    expect(() =>
      validateDiscountAgainstTotal(existing, { quantity: 1 })
    ).not.toThrow();
  });
});
