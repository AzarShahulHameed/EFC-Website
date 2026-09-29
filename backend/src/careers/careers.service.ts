import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateJobApplicationDto,
  CreateJobOpeningDto,
  UpdateJobOpeningDto,
} from './dto/careers.dto';

@Injectable()
export class CareersService {
  private readonly logger = new Logger(CareersService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // --- Job openings ---

  findOpenJobsPublic(department?: string, location?: string) {
    return this.prisma.jobOpening.findMany({
      where: { isOpen: true, department, location },
      orderBy: { postedAt: 'desc' },
    });
  }

  async findOneJobPublic(id: string) {
    const job = await this.prisma.jobOpening.findUnique({ where: { id } });
    if (!job || !job.isOpen) throw new NotFoundException('Job opening not found.');
    return job;
  }

  findAllJobsAdmin() {
    return this.prisma.jobOpening.findMany({
      orderBy: { postedAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
  }

  createJob(dto: CreateJobOpeningDto) {
    return this.prisma.jobOpening.create({
      data: { ...dto, closesAt: dto.closesAt ? new Date(dto.closesAt) : undefined, isOpen: dto.isOpen ?? true },
    });
  }

  async updateJob(id: string, dto: UpdateJobOpeningDto) {
    const job = await this.prisma.jobOpening.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job opening not found.');
    return this.prisma.jobOpening.update({
      where: { id },
      data: { ...dto, closesAt: dto.closesAt ? new Date(dto.closesAt) : undefined },
    });
  }

  async closeJob(id: string) {
    return this.updateJob(id, { isOpen: false });
  }

  // --- Applications ---

  async submitApplication(dto: CreateJobApplicationDto) {
    // Friendly pre-check first (a clear message beats a raw constraint
    // error), backed by the DB-level @@unique([jobId, email]) below as the
    // real guarantee — two submissions racing each other can both pass this
    // check, but only one can ever actually be inserted.
    const existing = await this.prisma.jobApplication.findFirst({
      where: { jobId: dto.jobId, email: dto.email },
    });
    if (existing) {
      throw new ConflictException("You've already applied to this position with this email address.");
    }

    try {
      const application = await this.prisma.jobApplication.create({
        data: {
          ...dto,
          answers: (dto.answers as unknown as Prisma.InputJsonValue) ?? undefined,
        },
        include: { job: true },
      });

      this.notifications
        .create(
          'JOB_APPLICATION',
          `New application: ${dto.fullName} applied for ${application.job?.title ?? 'a role'}`,
          undefined,
          '/admin/careers/applications',
        )
        .catch((err) => this.logger.warn(`Failed to write notification for job application: ${err.message}`));

      return application;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException("You've already applied to this position with this email address.");
      }
      throw err;
    }
  }

  findApplications(jobId?: string) {
    return this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: { job: true },
    });
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus, reviewerId?: string) {
    const application = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found.');
    return this.prisma.jobApplication.update({ where: { id }, data: { status, reviewerId } });
  }

  // Neutralizes CSV formula injection ("CSV injection" / "formula
  // injection"): a value starting with =, +, -, @, tab, or CR would be
  // interpreted as a formula by Excel/Sheets when the exported file is
  // opened, letting an applicant's submitted text (name, custom answers,
  // etc.) execute a formula on the admin's machine. Prefixing with a
  // straight quote forces spreadsheet apps to treat it as literal text,
  // same fix recommended by OWASP for this class of issue.
  private static sanitizeCsvCell(value: string): string {
    return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  }

  // CSV export for "Export CVs" in the admin brief.
  async exportApplicationsCsv(jobId?: string) {
    const rows = await this.findApplications(jobId);
    const header = 'Name,Email,Phone,Job,Status,Applied,Resume URL,Custom Answers';
    const lines = rows.map((r) =>
      [
        r.fullName,
        r.email,
        r.phone ?? '',
        r.job.title,
        r.status,
        r.createdAt.toISOString(),
        r.resumeUrl,
        r.answers ? JSON.stringify(r.answers) : '',
      ]
        .map((v) => `"${CareersService.sanitizeCsvCell(String(v)).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...lines].join('\n');
  }
}
