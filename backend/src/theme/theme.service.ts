import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateThemeDto } from './dto/theme.dto';

const DEFAULT_TOKENS = {
  primaryColor: '#0A1B33',
  secondaryColor: '#B08D3F',
  accentColor: '#B08D3F',
  backgroundColor: '#FBFAF7',
  // Independent header/footer background color — '' (the default) means
  // "use primaryColor", exactly like before this field existed. Only
  // setting one of these makes that section stop following the other, per
  // the previous single-shared-token limitation (both used to hardcode
  // `bg-navy`, which is `primaryColor` — see components/site/Header.tsx
  // and Footer.tsx, and app/layout.tsx for how the fallback + auto-contrast
  // text color are derived).
  headerColor: '',
  footerColor: '',
  typography: {
    headingFont: 'Spectral',
    bodyFont: 'Public Sans',
    // Site-wide text color for headings/body copy — '' means "use the
    // existing default ink/muted colors", so this is purely additive.
    // Applied via the `ink`/`muted` Tailwind colors, which every existing
    // `text-ink`/`text-muted` class site-wide already uses.
    headingColor: '',
    bodyColor: '',
  },
  buttonStyle: 'sharp', // "sharp" | "rounded" | "pill"
  cardStyle: 'bordered', // "bordered" | "shadowed" | "flat"
  borderRadius: '2px',
  menuStyle: 'standard',
};

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  async get() {
    const row = await this.prisma.themeSetting.findUnique({ where: { id: 'default' } });
    return row?.tokens ?? DEFAULT_TOKENS;
  }

  update(dto: UpdateThemeDto) {
    const tokens = dto.tokens as Prisma.InputJsonValue;
    return this.prisma.themeSetting.upsert({
      where: { id: 'default' },
      update: { tokens },
      create: { id: 'default', tokens },
    });
  }
}
