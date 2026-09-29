import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team-member.dto';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic(languageCode = 'en', branchId?: string, language?: string) {
    const members = await this.prisma.teamMember.findMany({
      where: { isActive: true, branchId: branchId ?? undefined },
      orderBy: { order: 'asc' },
      include: { translations: { where: { languageCode } }, branch: true },
    });
    return members
      .filter((m) => (language ? m.languagesSpoken.includes(language) : true))
      .map(this.flatten);
  }

  findAllAdmin() {
    return this.prisma.teamMember.findMany({
      orderBy: { order: 'asc' },
      include: { translations: true, branch: true },
    });
  }

  async findOneAdmin(id: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { id },
      include: { translations: true, branch: true },
    });
    if (!member) throw new NotFoundException('Team member not found.');
    return member;
  }

  create(dto: CreateTeamMemberDto) {
    return this.prisma.teamMember.create({
      data: {
        name: dto.name,
        category: dto.category || 'Key Member',
        photoUrl: dto.photoUrl,
        photoPosition: dto.photoPosition ?? 'center',
        branchId: dto.branchId,
        qualification: dto.qualification,
        linkedinUrl: dto.linkedinUrl,
        email: dto.email,
        phone: dto.phone,
        yearsExperience: dto.yearsExperience,
        languagesSpoken: dto.languagesSpoken ?? [],
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
        translations: { create: dto.translations },
      },
      include: { translations: true },
    });
  }

  async update(id: string, dto: UpdateTeamMemberDto) {
    await this.findOneAdmin(id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        for (const t of dto.translations) {
          await tx.teamMemberTranslation.upsert({
            where: { memberId_languageCode: { memberId: id, languageCode: t.languageCode } },
            update: t,
            create: { ...t, memberId: id },
          });
        }
      }

      return tx.teamMember.update({
        where: { id },
        data: {
          name: dto.name,
          category: dto.category,
          photoUrl: dto.photoUrl,
          photoPosition: dto.photoPosition,
          branchId: dto.branchId,
          qualification: dto.qualification,
          linkedinUrl: dto.linkedinUrl,
          email: dto.email,
          phone: dto.phone,
          yearsExperience: dto.yearsExperience,
          languagesSpoken: dto.languagesSpoken,
          isActive: dto.isActive,
          order: dto.order,
        },
        include: { translations: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.teamMember.delete({ where: { id } });
    return { deleted: true };
  }

  private flatten(member: any) {
    const t = member.translations[0];
    return {
      id: member.id,
      name: member.name,
      category: member.category ?? 'Key Member',
      photoUrl: member.photoUrl,
      photoPosition: member.photoPosition,
      qualification: member.qualification,
      linkedinUrl: member.linkedinUrl,
      email: member.email,
      phone: member.phone,
      languagesSpoken: member.languagesSpoken,
      branch: member.branch?.city,
      position: t?.position,
      bio: t?.bio,
      specialization: t?.specialization,
    };
  }

  // Bulk drag-and-drop reorder — the admin sends the full list of IDs in
  // their new display order; each row's `order` becomes its index.
  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.teamMember.update({ where: { id }, data: { order: index } })),
    );
    return { reordered: ids.length };
  }
}
