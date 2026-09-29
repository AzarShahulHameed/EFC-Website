-- AlterTable
ALTER TABLE "InsightArticle" ADD COLUMN     "coverImagePosition" TEXT DEFAULT 'center';

-- AlterTable
ALTER TABLE "ServiceTranslation" ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "costFactors" TEXT,
ADD COLUMN     "faqs" JSONB,
ADD COLUMN     "process" TEXT,
ADD COLUMN     "timeline" TEXT,
ADD COLUMN     "whatIsIt" TEXT,
ADD COLUMN     "whoNeedsIt" TEXT;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "photoPosition" TEXT DEFAULT 'center';
