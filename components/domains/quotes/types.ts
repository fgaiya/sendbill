// 最小形：このドメインUIが実際に触るフィールドのみ
export interface QuoteBasicsShape {
  clientId: string;
  issueDate: Date;
  expiryDate?: Date;
  notes?: string;
}
