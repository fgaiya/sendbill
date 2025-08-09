/*
  第2段階: バックフィル、NOT NULL化、旧userId削除
  
  安全な手順:
  1. userIdからcompanyIdへバックフィル
  2. companyIdをNOT NULL化
  3. 新しいインデックス・ユニーク制約追加
  4. 旧userIdフィールド・制約削除

*/

-- バックフィル: userIdベースでcompanyIdを設定
-- User-Company 1:1関係を利用してcompanyIdを逆引き
UPDATE "clients" SET "companyId" = (
  SELECT c.id FROM "companies" c 
  INNER JOIN "users" u ON c."userId" = u.id 
  WHERE u.id = "clients"."userId"
) WHERE "companyId" IS NULL;

UPDATE "quotes" SET "companyId" = (
  SELECT c.id FROM "companies" c 
  INNER JOIN "users" u ON c."userId" = u.id 
  WHERE u.id = "quotes"."userId"
) WHERE "companyId" IS NULL;

UPDATE "invoices" SET "companyId" = (
  SELECT c.id FROM "companies" c 
  INNER JOIN "users" u ON c."userId" = u.id 
  WHERE u.id = "invoices"."userId"
) WHERE "companyId" IS NULL;

-- companyIdをNOT NULLに変更
ALTER TABLE "clients" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "quotes" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "companyId" SET NOT NULL;

-- 旧外部キー制約削除
ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_userId_fkey";
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_clientId_fkey";
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_userId_fkey";
ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_clientId_fkey";
ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_userId_fkey";

-- 旧インデックス削除
DROP INDEX IF EXISTS "clients_userId_idx";
DROP INDEX IF EXISTS "invoices_clientId_idx";
DROP INDEX IF EXISTS "invoices_quoteId_idx";
DROP INDEX IF EXISTS "invoices_status_idx";
DROP INDEX IF EXISTS "invoices_userId_idx";
DROP INDEX IF EXISTS "invoices_userId_invoiceNumber_key";
DROP INDEX IF EXISTS "quotes_clientId_idx";
DROP INDEX IF EXISTS "quotes_status_idx";
DROP INDEX IF EXISTS "quotes_userId_idx";
DROP INDEX IF EXISTS "quotes_userId_quoteNumber_key";

-- 旧userIdカラム削除
ALTER TABLE "clients" DROP COLUMN "userId";
ALTER TABLE "invoices" DROP COLUMN "userId";
ALTER TABLE "quotes" DROP COLUMN "userId";

-- 新しいインデックス作成
CREATE INDEX "clients_companyId_idx" ON "clients"("companyId");
CREATE INDEX "clients_companyId_createdAt_idx" ON "clients"("companyId", "createdAt");
CREATE INDEX "clients_companyId_deletedAt_idx" ON "clients"("companyId", "deletedAt");

CREATE INDEX "invoices_companyId_clientId_status_quoteId_idx" ON "invoices"("companyId", "clientId", "status", "quoteId");
CREATE INDEX "invoices_companyId_status_issueDate_idx" ON "invoices"("companyId", "status", "issueDate");
CREATE INDEX "invoices_companyId_deletedAt_idx" ON "invoices"("companyId", "deletedAt");

CREATE INDEX "quotes_companyId_clientId_status_idx" ON "quotes"("companyId", "clientId", "status");
CREATE INDEX "quotes_companyId_status_issueDate_idx" ON "quotes"("companyId", "status", "issueDate");
CREATE INDEX "quotes_companyId_deletedAt_idx" ON "quotes"("companyId", "deletedAt");

-- ユニーク制約追加
CREATE UNIQUE INDEX "invoices_companyId_invoiceNumber_key" ON "invoices"("companyId", "invoiceNumber");
CREATE UNIQUE INDEX "quotes_companyId_quoteNumber_key" ON "quotes"("companyId", "quoteNumber");

-- 新しい外部キー制約追加
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_fkey" 
FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" 
FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;