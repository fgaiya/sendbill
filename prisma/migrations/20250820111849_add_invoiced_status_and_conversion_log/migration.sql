-- AlterEnum
ALTER TYPE "QuoteStatus" ADD VALUE 'INVOICED';

-- CreateTable
CREATE TABLE "conversion_logs" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "conversionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quoteSnapshot" JSONB NOT NULL,
    "selectedItemIds" TEXT[],
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "errorMessage" TEXT,
    "stackTrace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conversion_logs" ADD CONSTRAINT "conversion_logs_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_logs" ADD CONSTRAINT "conversion_logs_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_logs" ADD CONSTRAINT "conversion_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
