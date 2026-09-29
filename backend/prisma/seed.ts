import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Minimal seed: only what the app cannot bootstrap itself — the three
// languages (so the language switcher and admin have something to show)
// and one Super Admin account (so someone can log in to /admin at all).
// Every piece of *content* — services, team, branches, testimonials,
// insights, theme, SEO — is created through the admin dashboard, not here.
//
// Previously this hardcoded a fixed, published-in-this-codebase login
// (admin@efc.ae / ChangeMe123!) — fine for local development, but a real
// production run of this exact script would create a real admin account
// with a password anyone reading this file already knows. The first admin
// account's email/password now come from SEED_ADMIN_EMAIL/
// SEED_ADMIN_PASSWORD in the environment; if you don't set them, this
// generates a random one-time password and prints it ONCE — it is not
// stored anywhere else, so save it immediately (or just set
// SEED_ADMIN_PASSWORD yourself and re-run). Either way, change the
// password from Admin → Security right after your first login.
async function main() {
  await prisma.language.createMany({
    data: [
      { code: 'en', name: 'English', isRTL: false, isDefault: true },
      { code: 'ar', name: 'Arabic', isRTL: true },
      { code: 'de', name: 'German', isRTL: false },
    ],
    skipDuplicates: true,
  });

  const email = process.env.SEED_ADMIN_EMAIL;
  if (!email) {
    console.error(
      'SEED_ADMIN_EMAIL is not set — refusing to guess an admin email. ' +
        'Set SEED_ADMIN_EMAIL (and optionally SEED_ADMIN_PASSWORD) in your environment and re-run `npm run seed`.',
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Seed complete. An admin account for ${email} already exists — password left unchanged.`);
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, passwordHash, name: 'Super Admin', role: Role.SUPER_ADMIN },
  });

  console.log('Seed complete.');
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`Admin login: ${email} / ${password}`);
    console.log('This password was generated randomly and is shown here only once — save it now.');
  } else {
    console.log(`Admin login: ${email} / (the password you set in SEED_ADMIN_PASSWORD)`);
  }
  console.log('Change this password from Admin → Security immediately after logging in.');
  console.log('Everything else (services, team, branches, theme, ...) starts empty — add it from /admin.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
