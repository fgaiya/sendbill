/*
  第1段階: 安全なcompanyId追加とスキーマ拡張
  
  - companyIdをNULL許容で追加（既存データの保護）
  - Companyモデルの拡張フィールド追加
  - 新しいEnumとスキーマ構造追加
  - userIdは保持（バックフィル用）

*/

-- CreateEnum
CREATE TYPE "TaxCategory" AS ENUM ('STANDARD', 'REDUCED', 'EXEMPT', 'NON_TAX');

-- AlterTable: Companyモデル拡張（税率・採番カウンタ等）
ALTER TABLE "companies" 
ADD COLUMN "invoiceNumberSeq" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "priceIncludesTax" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "quoteNumberSeq" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "reducedTaxRate" DECIMAL(5,2) NOT NULL DEFAULT 8.00,
ADD COLUMN "standardTaxRate" DECIMAL(5,2) NOT NULL DEFAULT 10.00;

-- AlterTable: clientsにcompanyId（NULL許容）とdeletedAtを追加
ALTER TABLE "clients" 
ADD COLUMN "companyId" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: quotesにcompanyId（NULL許容）とdeletedAtを追加
ALTER TABLE "quotes" 
ADD COLUMN "companyId" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: invoicesにcompanyId（NULL許容）、deletedAt、paymentDateを追加
ALTER TABLE "invoices" 
ADD COLUMN "companyId" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "paymentDate" TIMESTAMP(3);

-- AlterTable: quote_itemsの拡張（精度向上、税区分、割引等）
ALTER TABLE "quote_items" 
ADD COLUMN "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "sku" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "taxCategory" "TaxCategory" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "unit" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);

-- AlterTable: invoice_itemsの拡張（精度向上、税区分、割引等）
ALTER TABLE "invoice_items" 
ADD COLUMN "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "sku" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "taxCategory" "TaxCategory" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "unit" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);

-- 外部キー制約追加（NULL許容フィールド用）
ALTER TABLE "clients" 
ADD CONSTRAINT "clients_companyId_fkey" 
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "quotes" 
ADD CONSTRAINT "quotes_companyId_fkey" 
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices" 
ADD CONSTRAINT "invoices_companyId_fkey" 
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;