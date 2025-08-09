/*
  Warnings:

  - You are about to drop the column `userId` on the `clients` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to drop the column `userId` on the `invoices` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `quote_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,3)`.
  - You are about to drop the column `userId` on the `quotes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,invoiceNumber]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,quoteNumber]` on the table `quotes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `quotes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaxCategory" AS ENUM ('STANDARD', 'REDUCED', 'EXEMPT', 'NON_TAX');

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_userId_fkey";

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_userId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_clientId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_userId_fkey";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_clientId_fkey";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_userId_fkey";

-- DropIndex
DROP INDEX "clients_userId_idx";

-- DropIndex
DROP INDEX "invoices_clientId_idx";

-- DropIndex
DROP INDEX "invoices_quoteId_idx";

-- DropIndex
DROP INDEX "invoices_status_idx";

-- DropIndex
DROP INDEX "invoices_userId_idx";

-- DropIndex
DROP INDEX "invoices_userId_invoiceNumber_key";

-- DropIndex
DROP INDEX "quotes_clientId_idx";

-- DropIndex
DROP INDEX "quotes_status_idx";

-- DropIndex
DROP INDEX "quotes_userId_idx";

-- DropIndex
DROP INDEX "quotes_userId_quoteNumber_key";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "userId",
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "invoiceNumberSeq" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "priceIncludesTax" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quoteNumberSeq" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "reducedTaxRate" DECIMAL(5,2) NOT NULL DEFAULT 8.00,
ADD COLUMN     "standardTaxRate" DECIMAL(5,2) NOT NULL DEFAULT 10.00;

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxCategory" "TaxCategory" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "unit" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "userId",
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "paymentDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxCategory" "TaxCategory" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "unit" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "quotes" DROP COLUMN "userId",
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "clients_companyId_idx" ON "clients"("companyId");

-- CreateIndex
CREATE INDEX "clients_companyId_createdAt_idx" ON "clients"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "clients_companyId_deletedAt_idx" ON "clients"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "invoices_companyId_clientId_status_quoteId_idx" ON "invoices"("companyId", "clientId", "status", "quoteId");

-- CreateIndex
CREATE INDEX "invoices_companyId_status_issueDate_idx" ON "invoices"("companyId", "status", "issueDate");

-- CreateIndex
CREATE INDEX "invoices_companyId_deletedAt_idx" ON "invoices"("companyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_companyId_invoiceNumber_key" ON "invoices"("companyId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "quotes_companyId_clientId_status_idx" ON "quotes"("companyId", "clientId", "status");

-- CreateIndex
CREATE INDEX "quotes_companyId_status_issueDate_idx" ON "quotes"("companyId", "status", "issueDate");

-- CreateIndex
CREATE INDEX "quotes_companyId_deletedAt_idx" ON "quotes"("companyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_companyId_quoteNumber_key" ON "quotes"("companyId", "quoteNumber");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
