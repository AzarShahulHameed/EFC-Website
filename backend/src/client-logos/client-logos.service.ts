import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientLogoDto, UpdateClientLogoDto } from './dto/client-logo.dto';

@Injectable()
export class ClientLogosService {
  constructor(private prisma: PrismaService) {}

  findAllPublic() {
    return this.prisma.clientLogo.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
  }

  findAllAdmin() {
    return this.prisma.clientLogo.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateClientLogoDto) {
    return this.prisma.clientLogo.create({ data: { ...dto, isActive: dto.isActive ?? true, order: dto.order ?? 0 } });
  }

  async update(id: string, dto: UpdateClientLogoDto) {
    const existing = await this.prisma.clientLogo.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Client logo not found.');
    return this.prisma.clientLogo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const existing = await this.prisma.clientLogo.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Client logo not found.');
    await this.prisma.clientLogo.delete({ where: { id } });
    return { deleted: true };
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.clientLogo.update({ where: { id }, data: { order: index } })),
    );
    return { reordered: ids.length };
  }
}
