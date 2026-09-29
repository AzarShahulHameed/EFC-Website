import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic(languageCode = 'en') {
    const rows = await this.prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: { translations: { where: { languageCode } } },
    });
    return rows.map((t) => ({
      clientName: t.clientName,
      clientTitle: t.clientTitle,
      clientPhotoUrl: t.clientPhotoUrl,
      rating: t.rating,
      quote: t.translations[0]?.quote,
    }));
  }

  findAllAdmin() {
    return this.prisma.testimonial.findMany({ orderBy: { order: 'asc' }, include: { translations: true } });
  }

  async findOne(id: string) {
    const row = await this.prisma.testimonial.findUnique({ where: { id }, include: { translations: true } });
    if (!row) throw new NotFoundException('Testimonial not found.');
    return row;
  }

  create(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({
      data: {
        clientName: dto.clientName,
        clientTitle: dto.clientTitle,
        clientPhotoUrl: dto.clientPhotoUrl,
        rating: dto.rating ?? 5,
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
        translations: { create: dto.translations },
      },
      include: { translations: true },
    });
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        for (const t of dto.translations) {
          await tx.testimonialTranslation.upsert({
            where: { testimonialId_languageCode: { testimonialId: id, languageCode: t.languageCode } },
            update: t,
            create: { ...t, testimonialId: id },
          });
        }
      }
      return tx.testimonial.update({
        where: { id },
        data: {
          clientName: dto.clientName,
          clientTitle: dto.clientTitle,
          clientPhotoUrl: dto.clientPhotoUrl,
          rating: dto.rating,
          isActive: dto.isActive,
          order: dto.order,
        },
        include: { translations: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.testimonial.delete({ where: { id } });
    return { deleted: true };
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.testimonial.update({ where: { id }, data: { order: index } })),
    );
    return { reordered: ids.length };
  }
}
