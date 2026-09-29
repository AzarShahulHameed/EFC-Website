import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  findAllPublic() {
    return this.prisma.branch.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
  }

  findAllAdmin() {
    return this.prisma.branch.findMany({ orderBy: { order: 'asc' } });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found.');
    return branch;
  }

  create(dto: CreateBranchDto) {
    return this.prisma.branch.create({ data: { ...dto, isActive: dto.isActive ?? true, order: dto.order ?? 0 } });
  }

  async update(id: string, dto: UpdateBranchDto) {
    await this.findOne(id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.branch.delete({ where: { id } });
    return { deleted: true };
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.branch.update({ where: { id }, data: { order: index } })),
    );
    return { reordered: ids.length };
  }
}
