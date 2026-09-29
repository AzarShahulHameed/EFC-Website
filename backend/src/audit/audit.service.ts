import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditLogQuery = {
  entityType?: string;
  action?: string;
  userId?: string;
  days?: number;
  page?: number;
  pageSize?: number;
};

const MAX_PAGE_SIZE = 100;

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findRecent(query: AuditLogQuery) {
    const pageSize = Math.min(Math.max(query.pageSize ?? 50, 1), MAX_PAGE_SIZE);
    const page = Math.max(query.page ?? 1, 1);

    const where: Prisma.AuditLogWhereInput = {
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.days ? { createdAt: { gte: new Date(Date.now() - query.days * 24 * 60 * 60 * 1000) } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
  }

  // Distinct entity types actually logged so far — feeds the admin
  // dashboard's filter dropdown with real values instead of a hardcoded
  // list that drifts out of sync with whatever resources actually exist.
  async distinctEntityTypes(): Promise<string[]> {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['entityType'],
      select: { entityType: true },
      orderBy: { entityType: 'asc' },
    });
    return rows.map((r) => r.entityType);
  }
}
