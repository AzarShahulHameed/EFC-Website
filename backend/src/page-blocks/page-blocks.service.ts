import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageBlockDto, UpdatePageBlockDto } from './dto/page-block.dto';

@Injectable()
export class PageBlocksService {
  constructor(private prisma: PrismaService) {}

  // Public — every active block for a page, in order, falling back to the
  // English blocks if none exist for the requested language yet (same
  // "requested lang, else English" idea used for Service translations,
  // just simpler since a block's whole content is the JSON blob).
  async findAllPublic(page: string, languageCode = 'en') {
    const rows = await this.prisma.pageBlock.findMany({
      where: { page, isActive: true, languageCode },
      orderBy: { order: 'asc' },
    });
    if (rows.length > 0 || languageCode === 'en') return rows;
    return this.prisma.pageBlock.findMany({
      where: { page, isActive: true, languageCode: 'en' },
      orderBy: { order: 'asc' },
    });
  }

  // Admin — every block for a page (any language, active or not), so the
  // builder UI can list/edit/reorder/toggle them.
  findAllAdmin(page: string) {
    return this.prisma.pageBlock.findMany({ where: { page }, orderBy: { order: 'asc' } });
  }

  async create(dto: CreatePageBlockDto) {
    const count = await this.prisma.pageBlock.count({ where: { page: dto.page } });
    return this.prisma.pageBlock.create({
      data: {
        page: dto.page,
        languageCode: dto.languageCode || 'en',
        type: dto.type,
        content: dto.content as unknown as Prisma.InputJsonValue,
        animation: dto.animation || 'fade-up',
        order: dto.order ?? count,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdatePageBlockDto) {
    const existing = await this.prisma.pageBlock.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Page block not found.');
    return this.prisma.pageBlock.update({
      where: { id },
      data: {
        ...dto,
        content: dto.content !== undefined ? (dto.content as unknown as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.pageBlock.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Page block not found.');
    await this.prisma.pageBlock.delete({ where: { id } });
    return { deleted: true };
  }

  // Reorders within one page. Scoped server-side by `page` (not just
  // trusted from the client) via `updateMany({ where: { id, page } })` —
  // an id that doesn't belong to this page, or doesn't exist at all,
  // simply matches zero rows instead of reordering a block that lives
  // elsewhere or 500ing the whole batch.
  async reorder(page: string, ids: string[]) {
    const results = await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.pageBlock.updateMany({ where: { id, page }, data: { order: index } })),
    );
    const reordered = results.reduce((sum: number, r: { count: number }) => sum + r.count, 0);
    return { reordered, requested: ids.length };
  }
}
