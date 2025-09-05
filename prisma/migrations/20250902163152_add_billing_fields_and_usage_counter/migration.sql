/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `companies` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BillingPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "UsageMetric" AS ENUM ('DOCUMENT_CREATE', 'PDF_GENERATE');

-- CreateEnum
CREATE TYPE "UsagePeriod" AS ENUM ('DAILY', 'MONTHLY');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "plan" "BillingPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateTable
CREATE TABLE "usage_counters" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "metric" "UsageMetric" NOT NULL,
    "period" "UsagePeriod" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL,
    "planAtThatTime" "BillingPlan" NOT NULL,
    "graceLimit" INTEGER NOT NULL DEFAULT 0,
    "graceUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_counters_companyId_metric_period_periodKey_idx" ON "usage_counters"("companyId", "metric", "period", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "usage_counters_companyId_period_periodKey_metric_key" ON "usage_counters"("companyId", "period", "periodKey", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "companies_stripeCustomerId_key" ON "companies"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_stripeSubscriptionId_key" ON "companies"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
