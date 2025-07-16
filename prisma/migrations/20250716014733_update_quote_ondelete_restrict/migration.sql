-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_quoteId_fkey";

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
