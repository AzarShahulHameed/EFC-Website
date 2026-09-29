import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFreezoneApprovalDto, UpdateFreezoneApprovalDto } from './dto/freezone.dto';

@Injectable()
export class FreezoneService {
  constructor(private prisma: PrismaService) {}

  // Public: badge/headline/body/ctaLabel are the base English columns on
  // FreezoneApproval itself — for any other language, overlay the matching
  // FreezoneApprovalTranslation row where it has a value, falling back
  // field-by-field to the English base text so a partially-translated card
  // (or one that was never translated at all) still renders completely
  // instead of showing blank text for whatever wasn't overridden.
  async findAllPublic(languageCode = 'en') {
    const approvals = await this.prisma.freezoneApproval.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: languageCode === 'en' ? undefined : { translations: { where: { languageCode } } },
    });
    return approvals.map((a: any) => this.overlay(a, languageCode));
  }

  private overlay(approval: any, languageCode: string) {
    const t = languageCode === 'en' ? undefined : approval.translations?.[0];
    const { translations, ...base } = approval;
    return {
      ...base,
      badge: t?.badge || base.badge,
      headline: t?.headline || base.headline,
      body: t?.body || base.body,
      ctaLabel: t?.ctaLabel || base.ctaLabel,
    };
  }

  findAllAdmin() {
    return this.prisma.freezoneApproval.findMany({ orderBy: { order: 'asc' }, include: { translations: true } });
  }

  create(dto: CreateFreezoneApprovalDto) {
    return this.prisma.freezoneApproval.create({ data: { ...dto, isActive: dto.isActive ?? true, order: dto.order ?? 0 } });
  }

  async update(id: string, dto: UpdateFreezoneApprovalDto) {
    const existing = await this.prisma.freezoneApproval.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Freezone approval not found.');
    const { translations, ...rest } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (translations) {
        for (const t of translations) {
          await tx.freezoneApprovalTranslation.upsert({
            where: { freezoneApprovalId_languageCode: { freezoneApprovalId: id, languageCode: t.languageCode } },
            update: t,
            create: { ...t, freezoneApprovalId: id },
          });
        }
      }
      return tx.freezoneApproval.update({ where: { id }, data: rest, include: { translations: true } });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.freezoneApproval.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Freezone approval not found.');
    await this.prisma.freezoneApproval.delete({ where: { id } });
    return { deleted: true };
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.freezoneApproval.update({ where: { id }, data: { order: index } })),
    );
    return { reordered: ids.length };
  }
}
