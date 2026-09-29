-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "answers" JSONB;

-- AlterTable
ALTER TABLE "JobOpening" ADD COLUMN     "qualifications" TEXT,
ADD COLUMN     "responsibilities" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "imagePosition" TEXT DEFAULT 'center',
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "responsiblePersonId" TEXT;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_responsiblePersonId_fkey" FOREIGN KEY ("responsiblePersonId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
