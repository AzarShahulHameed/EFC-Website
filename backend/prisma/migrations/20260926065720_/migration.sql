-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "externalUrl" TEXT;

-- AlterTable
ALTER TABLE "InsightArticle" ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "postType" TEXT NOT NULL DEFAULT 'insight';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "PageView" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "SeoMeta" ADD COLUMN     "noindex" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SubService" ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "body" TEXT,
ADD COLUMN     "costFactors" TEXT,
ADD COLUMN     "faqs" JSONB,
ADD COLUMN     "imagePosition" TEXT DEFAULT 'center',
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "process" TEXT,
ADD COLUMN     "responsiblePersonId" TEXT,
ADD COLUMN     "timeline" TEXT,
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "whatIsIt" TEXT,
ADD COLUMN     "whoNeedsIt" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "PageBlock" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'en',
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "animation" TEXT NOT NULL DEFAULT 'fade-up',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreezoneApproval" (
    "id" TEXT NOT NULL,
    "badge" TEXT NOT NULL DEFAULT 'Freezone Approved',
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Learn more',
    "ctaHref" TEXT NOT NULL DEFAULT '/about',
    "imageUrl" TEXT,
    "imagePosition" TEXT NOT NULL DEFAULT 'center',
    "videoUrl" TEXT,
    "mediaPosition" TEXT NOT NULL DEFAULT 'right',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FreezoneApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "provider" TEXT NOT NULL DEFAULT 'smtp',
    "fromName" TEXT,
    "fromEmail" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "resendApiKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudinarySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "cloudName" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudinarySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslateSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "apiKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslateSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationUsageLog" (
    "id" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL,
    "languageCode" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageBlock_page_languageCode_idx" ON "PageBlock"("page", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "Notification_isRead_createdAt_idx" ON "Notification"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "TranslationUsageLog_createdAt_idx" ON "TranslationUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_sessionId_idx" ON "Lead"("sessionId");

-- CreateIndex
CREATE INDEX "PageView_sessionId_idx" ON "PageView"("sessionId");

-- AddForeignKey
ALTER TABLE "SubService" ADD CONSTRAINT "SubService_responsiblePersonId_fkey" FOREIGN KEY ("responsiblePersonId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
