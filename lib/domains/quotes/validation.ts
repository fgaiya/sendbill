export function validateDiscountAgainstTotal(
  existing: { unitPrice: number; quantity: number },
  patch: { discountAmount?: number; unitPrice?: number; quantity?: number }
): void {
  const unitPrice = patch.unitPrice ?? existing.unitPrice;
  const quantity = patch.quantity ?? existing.quantity;
  const total = unitPrice * quantity;
  if (patch.discountAmount !== undefined && patch.discountAmount > total) {
    throw new Error('割引額は品目合計金額を超えることはできません');
  }
}
