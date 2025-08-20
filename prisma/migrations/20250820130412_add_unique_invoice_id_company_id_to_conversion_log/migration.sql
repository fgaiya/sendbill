/*
  Warnings:

  - A unique constraint covering the columns `[invoiceId,companyId]` on the table `conversion_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "conversion_logs_invoiceId_companyId_key" ON "conversion_logs"("invoiceId", "companyId");
