import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// One-time cleanup for a database that was seeded before the seed script
// was trimmed down. Safe to run more than once — everything here is
// conditional on the exact demo rows the old seed created.
async function main() {
  const demoService = await prisma.service.findUnique({ where: { slug: 'external-audit' } });
  if (demoService) {
    await prisma.serviceTranslation.deleteMany({ where: { serviceId: demoService.id } });
    await prisma.service.delete({ where: { id: demoService.id } });
    console.log('Removed demo service "external-audit".');
  }

  const demoCategory = await prisma.serviceCategory.findUnique({ where: { slug: 'audit' } });
  if (demoCategory) {
    await prisma.serviceCategory.delete({ where: { id: demoCategory.id } });
    console.log('Removed demo service category "audit".');
  }

  const demoTheme = await prisma.themeSetting.findUnique({ where: { id: 'default' } });
  if (demoTheme) {
    await prisma.themeSetting.delete({ where: { id: 'default' } });
    console.log('Removed seeded theme row (the app falls back to built-in defaults without it).');
  }

  console.log('Demo data cleanup complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
