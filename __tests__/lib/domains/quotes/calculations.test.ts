import {
  calculateItemTax,
  calculateQuoteTotal,
  formatTaxSummary,
  type CompanyForCalculation,
  type QuoteItemFormData,
} from '@/lib/domains/quotes/calculations';

describe('Quote Calculations', () => {
  const defaultCompany: CompanyForCalculation = {
    standardTaxRate: 10,
    reducedTaxRate: 8,
    priceIncludesTax: false,
  };

  const taxInclusiveCompany: CompanyForCalculation = {
    standardTaxRate: 10,
    reducedTaxRate: 8,
    priceIncludesTax: true,
  };

  describe('calculateItemTax', () => {
    describe('税抜価格計算', () => {
      test('標準税率10%の計算', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1000,
          quantity: 2,
          discountAmount: 0,
          taxCategory: 'STANDARD',
        };

        const result = calculateItemTax(item, defaultCompany);

        expect(result.lineNet).toBe(2000); // 1000 * 2
        expect(result.lineTax).toBe(200); // 2000 * 0.1
        expect(result.lineTotal).toBe(2200);
        expect(result.effectiveTaxRate).toBe(10);
        expect(result.taxCategory).toBe('STANDARD');
      });

      test('軽減税率8%の計算', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1000,
          quantity: 3,
          discountAmount: 0,
          taxCategory: 'REDUCED',
        };

        const result = calculateItemTax(item, defaultCompany);

        expect(result.lineNet).toBe(3000);
        expect(result.lineTax).toBe(240); // 3000 * 0.08
        expect(result.lineTotal).toBe(3240);
        expect(result.effectiveTaxRate).toBe(8);
        expect(result.taxCategory).toBe('REDUCED');
      });

      test('免税品の計算', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1000,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'EXEMPT',
        };

        const result = calculateItemTax(item, defaultCompany);

        expect(result.lineNet).toBe(1000);
        expect(result.lineTax).toBe(0);
        expect(result.lineTotal).toBe(1000);
        expect(result.effectiveTaxRate).toBe(0);
        expect(result.taxCategory).toBe('EXEMPT');
      });

      test('非課税品の計算', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1000,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'NON_TAX',
        };

        const result = calculateItemTax(item, defaultCompany);

        expect(result.lineNet).toBe(1000);
        expect(result.lineTax).toBe(0);
        expect(result.lineTotal).toBe(1000);
        expect(result.effectiveTaxRate).toBe(0);
        expect(result.taxCategory).toBe('NON_TAX');
      });

      test('割引ありの計算', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1000,
          quantity: 3,
          discountAmount: 500,
          taxCategory: 'STANDARD',
        };

        const result = calculateItemTax(item, defaultCompany);

        expect(result.lineNet).toBe(2500); // 3000 - 500
        expect(result.lineTax).toBe(250); // 2500 * 0.1
        expect(result.lineTotal).toBe(2750);
      });

      test('個別税率設定の計算', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1000,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'STANDARD',
          taxRate: 5, // 個別に5%設定
        };

        const result = calculateItemTax(item, defaultCompany);

        expect(result.lineNet).toBe(1000);
        expect(result.lineTax).toBe(50); // 1000 * 0.05
        expect(result.lineTotal).toBe(1050);
        expect(result.effectiveTaxRate).toBe(5);
        expect(result.taxCategory).toBe('STANDARD');
      });

      test('EXEMPT/NON_TAXに個別税率が設定されても税額0になる', () => {
        const exemptItem: Partial<QuoteItemFormData> = {
          unitPrice: 1000,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'EXEMPT',
          taxRate: 10, // 個別税率を設定しても無視される
        };

        const nonTaxItem: Partial<QuoteItemFormData> = {
          unitPrice: 1000,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'NON_TAX',
          taxRate: 8, // 個別税率を設定しても無視される
        };

        const exemptResult = calculateItemTax(exemptItem, defaultCompany);
        const nonTaxResult = calculateItemTax(nonTaxItem, defaultCompany);

        // 両方とも税額0であること
        expect(exemptResult.lineNet).toBe(1000);
        expect(exemptResult.lineTax).toBe(0);
        expect(exemptResult.lineTotal).toBe(1000);
        expect(exemptResult.effectiveTaxRate).toBe(0);
        expect(exemptResult.taxCategory).toBe('EXEMPT');

        expect(nonTaxResult.lineNet).toBe(1000);
        expect(nonTaxResult.lineTax).toBe(0);
        expect(nonTaxResult.lineTotal).toBe(1000);
        expect(nonTaxResult.effectiveTaxRate).toBe(0);
        expect(nonTaxResult.taxCategory).toBe('NON_TAX');
      });
    });

    describe('税込価格計算', () => {
      test('税込価格からの税抜額逆算（10%）', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1100, // 税込価格
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'STANDARD',
        };

        const result = calculateItemTax(item, taxInclusiveCompany);

        expect(result.lineNet).toBe(1000); // 1100 ÷ 1.1 = 1000 (四捨五入)
        expect(result.lineTax).toBe(100); // 1000 * 0.1
        expect(result.lineTotal).toBe(1100);
      });

      test('税込価格からの税抜額逆算（8%）', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1080, // 税込価格
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'REDUCED',
        };

        const result = calculateItemTax(item, taxInclusiveCompany);

        expect(result.lineNet).toBe(1000); // 1080 ÷ 1.08 = 1000
        expect(result.lineTax).toBe(80); // 1000 * 0.08
        expect(result.lineTotal).toBe(1080);
      });

      test('税込で数量が少数・割引後に行単位逆算', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1100, // 税込単価
          quantity: 0.5, // 少数数量
          discountAmount: 50, // 割引額
          taxCategory: 'STANDARD',
        };

        const result = calculateItemTax(item, taxInclusiveCompany);

        // 税込金額（割引後）: 1100 * 0.5 - 50 = 500
        // 税抜額: 500 ÷ 1.1 = 454.545... → 455（四捨五入）
        // 税額: 500 - 455 = 45
        expect(result.lineNet).toBe(455);
        expect(result.lineTax).toBe(45);
        expect(result.lineTotal).toBe(500);
      });
    });

    describe('端数処理（PER_LINE四捨五入）', () => {
      test('税額の四捨五入', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 333,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'STANDARD',
        };

        const result = calculateItemTax(item, defaultCompany);

        expect(result.lineNet).toBe(333);
        expect(result.lineTax).toBe(33); // 333 * 0.1 = 33.3 → 33（四捨五入）
        expect(result.lineTotal).toBe(366);
      });

      test('税込逆算の四捨五入', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1001, // 税込価格
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'STANDARD',
        };

        const result = calculateItemTax(item, taxInclusiveCompany);

        expect(result.lineNet).toBe(910); // 1001 ÷ 1.1 = 910.0909... → 910（四捨五入）
        expect(result.lineTax).toBe(91); // 910 * 0.1 = 91
        expect(result.lineTotal).toBe(1001);
      });
    });

    describe('不正値・境界値の処理', () => {
      test('負の単価', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: -100,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'STANDARD',
        };

        const result = calculateItemTax(item, defaultCompany);

        expect(result.lineNet).toBe(0);
        expect(result.lineTax).toBe(0);
        expect(result.lineTotal).toBe(0);
      });

      test('ゼロ数量', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1000,
          quantity: 0,
          discountAmount: 0,
          taxCategory: 'STANDARD',
        };

        const result = calculateItemTax(item, defaultCompany);

        expect(result.lineNet).toBe(0);
        expect(result.lineTax).toBe(0);
        expect(result.lineTotal).toBe(0);
      });

      test('割引額が小計を超える場合', () => {
        const item: Partial<QuoteItemFormData> = {
          unitPrice: 1000,
          quantity: 1,
          discountAmount: 1500, // 小計1000を超える割引
          taxCategory: 'STANDARD',
        };

        const result = calculateItemTax(item, defaultCompany);

        expect(result.lineNet).toBe(0); // Math.max(0, 1000 - 1500)
        expect(result.lineTax).toBe(0);
        expect(result.lineTotal).toBe(0);
      });
    });
  });

  describe('calculateQuoteTotal', () => {
    test('複数品目の税率別集計', () => {
      const items: QuoteItemFormData[] = [
        {
          description: '標準税率商品',
          unitPrice: 1000,
          quantity: 2,
          discountAmount: 0,
          taxCategory: 'STANDARD',
          unit: '',
          sku: '',
          sortOrder: 0,
        },
        {
          description: '軽減税率商品',
          unitPrice: 500,
          quantity: 3,
          discountAmount: 0,
          taxCategory: 'REDUCED',
          unit: '',
          sku: '',
          sortOrder: 1,
        },
        {
          description: '免税商品',
          unitPrice: 800,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'EXEMPT',
          unit: '',
          sku: '',
          sortOrder: 2,
        },
      ];

      const result = calculateQuoteTotal(items, defaultCompany);

      expect(result.subtotal).toBe(4300); // 2000 + 1500 + 800
      expect(result.totalTax).toBe(320); // 200 + 120 + 0
      expect(result.totalAmount).toBe(4620);

      // 税率別集計の確認
      expect(result.taxSummary).toHaveLength(3);

      const standardSummary = result.taxSummary.find((s) => s.taxRate === 10);
      expect(standardSummary).toEqual({
        taxRate: 10,
        taxableAmount: 2000,
        taxAmount: 200,
        category: 'standard',
      });

      const reducedSummary = result.taxSummary.find((s) => s.taxRate === 8);
      expect(reducedSummary).toEqual({
        taxRate: 8,
        taxableAmount: 1500,
        taxAmount: 120,
        category: 'reduced',
      });

      const exemptSummary = result.taxSummary.find(
        (s) => s.taxRate === 0 && s.category === 'exempt'
      );
      expect(exemptSummary).toEqual({
        taxRate: 0,
        taxableAmount: 800,
        taxAmount: 0,
        category: 'exempt',
      });
    });

    test('空の品目配列', () => {
      const result = calculateQuoteTotal([], defaultCompany);

      expect(result.subtotal).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.taxSummary).toEqual([]);
      expect(result.itemResults).toEqual([]);
    });

    test('同一税率の品目が複数ある場合の集計', () => {
      const items: QuoteItemFormData[] = [
        {
          description: '標準税率商品1',
          unitPrice: 1000,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'STANDARD',
          unit: '',
          sku: '',
          sortOrder: 0,
        },
        {
          description: '標準税率商品2',
          unitPrice: 2000,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'STANDARD',
          unit: '',
          sku: '',
          sortOrder: 1,
        },
      ];

      const result = calculateQuoteTotal(items, defaultCompany);

      expect(result.subtotal).toBe(3000);
      expect(result.totalTax).toBe(300);
      expect(result.totalAmount).toBe(3300);
      expect(result.taxSummary).toHaveLength(1);
      expect(result.taxSummary[0]).toEqual({
        taxRate: 10,
        taxableAmount: 3000,
        taxAmount: 300,
        category: 'standard',
      });
    });

    test('EXEMPT/NON_TAX混在時の内訳分離', () => {
      const items: QuoteItemFormData[] = [
        {
          description: '免税商品',
          unitPrice: 1000,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'EXEMPT',
          unit: '',
          sku: '',
          sortOrder: 0,
        },
        {
          description: '非課税商品',
          unitPrice: 1000,
          quantity: 1,
          discountAmount: 0,
          taxCategory: 'NON_TAX',
          unit: '',
          sku: '',
          sortOrder: 1,
        },
      ];

      const result = calculateQuoteTotal(items, defaultCompany);

      expect(result.subtotal).toBe(2000);
      expect(result.totalTax).toBe(0);
      expect(result.totalAmount).toBe(2000);

      // 免税と非課税が別々の内訳として表示されること
      expect(result.taxSummary).toHaveLength(2);

      const exemptSummary = result.taxSummary.find(
        (s) => s.category === 'exempt'
      );
      const nonTaxSummary = result.taxSummary.find(
        (s) => s.category === 'non_tax'
      );

      expect(exemptSummary).toEqual({
        taxRate: 0,
        taxableAmount: 1000,
        taxAmount: 0,
        category: 'exempt',
      });

      expect(nonTaxSummary).toEqual({
        taxRate: 0,
        taxableAmount: 1000,
        taxAmount: 0,
        category: 'non_tax',
      });
    });
  });

  describe('formatTaxSummary', () => {
    test('税率別集計の文字列フォーマット', () => {
      const taxSummary = [
        {
          taxRate: 10,
          taxableAmount: 2000,
          taxAmount: 200,
          category: 'standard' as const,
        },
        {
          taxRate: 8,
          taxableAmount: 1500,
          taxAmount: 120,
          category: 'reduced' as const,
        },
        {
          taxRate: 0,
          taxableAmount: 800,
          taxAmount: 0,
          category: 'exempt' as const,
        },
      ];

      const formatted = formatTaxSummary(taxSummary);

      expect(formatted).toContain('10%');
      expect(formatted).toContain('8%');
      expect(formatted).toContain('免税');
      expect(formatted).toContain('¥2,000');
      expect(formatted).toContain('¥200');
    });

    test('空の集計', () => {
      const formatted = formatTaxSummary([]);
      expect(formatted).toBe('税額計算なし');
    });
  });
});
