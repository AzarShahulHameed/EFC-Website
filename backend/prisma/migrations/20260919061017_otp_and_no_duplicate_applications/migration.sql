/*
  Warnings:

  - A unique constraint covering the columns `[jobId,email]` on the table `JobApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pendingEmail" TEXT,
ADD COLUMN     "pendingOtpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "pendingOtpHash" TEXT,
ADD COLUMN     "pendingOtpPurpose" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobId_email_key" ON "JobApplication"("jobId", "email");
