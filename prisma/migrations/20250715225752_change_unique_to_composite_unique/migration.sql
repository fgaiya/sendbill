/*
  Warnings:

  - A unique constraint covering the columns `[userId,invoiceNumber]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,quoteNumber]` on the table `quotes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "invoices_invoiceNumber_key";

-- DropIndex
DROP INDEX "quotes_quoteNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "invoices_userId_invoiceNumber_key" ON "invoices"("userId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_userId_quoteNumber_key" ON "quotes"("userId", "quoteNumber");
