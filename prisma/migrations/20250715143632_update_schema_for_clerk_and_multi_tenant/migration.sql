/*
  Warnings:

  - The values [CANCELLED] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `company` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to drop the column `number` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `invoices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `invoice_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceNumber` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED');

-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE');
ALTER TABLE "invoices" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "InvoiceStatus_old";
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropIndex
DROP INDEX "clients_email_key";

-- DropIndex
DROP INDEX "invoices_number_key";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "company",
DROP COLUMN "email",
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invoice_items" DROP COLUMN "amount",
DROP COLUMN "name",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "taxRate" DECIMAL(5,2),
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "unitPrice" DROP DEFAULT;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "number",
DROP COLUMN "subtotal",
DROP COLUMN "taxAmount",
DROP COLUMN "title",
DROP COLUMN "totalAmount",
ADD COLUMN     "invoiceNumber" TEXT NOT NULL,
ADD COLUMN     "quoteId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "dueDate" DROP NOT NULL;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessName" TEXT,
    "logoUrl" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "contactEmail" TEXT,
    "invoiceRegistrationNumber" TEXT,
    "representativeName" TEXT,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountHolder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_userId_key" ON "companies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quoteNumber_key" ON "quotes"("quoteNumber");

-- CreateIndex
CREATE INDEX "quotes_clientId_idx" ON "quotes"("clientId");

-- CreateIndex
CREATE INDEX "quotes_userId_idx" ON "quotes"("userId");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quote_items_quoteId_idx" ON "quote_items"("quoteId");

-- CreateIndex
CREATE INDEX "clients_userId_idx" ON "clients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_quoteId_idx" ON "invoices"("quoteId");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
