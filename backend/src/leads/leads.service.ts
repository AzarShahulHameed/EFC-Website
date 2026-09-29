import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLeadDto } from './dto/lead.dto';

// How soon the *same* email+message combo can be submitted again before
// it's treated as an accidental duplicate (double-click on "Send Inquiry",
// a resubmitted form after a slow network response, a browser back-button
// resubmit). Genuine repeat inquiries just need to wait a couple of
// minutes, which is fine for a "no more duplicates" guard — not a
// permanent block, and legitimate quick corrections rarely land inside it.
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Every inquiry (contact form, chatbot, career form, WhatsApp webhook,
  // consultation form) should call this to create a lead.
  async create(dto: CreateLeadDto) {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
    const recentDuplicate = await this.prisma.lead.findFirst({
      where: {
        email: dto.email,
        source: dto.source,
        message: dto.message ?? null,
        createdAt: { gte: since },
      },
    });
    if (recentDuplicate) {
      throw new ConflictException(
        "We've already received this inquiry — thanks! A team member will be in touch shortly.",
      );
    }
    const lead = await this.prisma.lead.create({ data: dto });

    // Best-effort: a notification-write failure must never fail the
    // inquiry itself — the same fire-and-forget principle the Audit Log
    // interceptor uses for the same reason.
    this.notifications
      .create('NEW_LEAD', `New inquiry from ${dto.name || dto.email}`, dto.message ?? undefined, '/admin/leads')
      .catch((err) => this.logger.warn(`Failed to write notification for new lead: ${err.message}`));

    return lead;
  }

  async findAll(status?: LeadStatus, source?: string, assignedToId?: string) {
    const leads = await this.prisma.lead.findMany({
      where: { status, source: source as any, assignedToId },
      orderBy: { createdAt: 'desc' },
      include: { branch: true, assignedTo: { select: { id: true, name: true } } },
    });
    return this.withExitPages(leads);
  }

  // Attaches `exitPage` — the last page each lead's own browser session
  // visited — to a list of leads, for a follow-up list an admin can act on
  // (email/ad retargeting: "this person's email, and this is the last page
  // they were looking at before they left"). One grouped query for every
  // lead's sessionId rather than one query per lead, same "fetch raw, walk
  // it in JS" approach AnalyticsService already uses for entry/exit pages,
  // to avoid an N+1 query per lead in the list.
  private async withExitPages<T extends { sessionId: string | null }>(leads: T[]): Promise<(T & { exitPage: string | null })[]> {
    const sessionIds = Array.from(new Set(leads.map((l) => l.sessionId).filter((s): s is string => !!s)));
    if (sessionIds.length === 0) return leads.map((l) => ({ ...l, exitPage: null }));
    const rows = await this.prisma.pageView.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { sessionId: true, path: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const lastPathBySession = new Map<string, string>();
    for (const row of rows) lastPathBySession.set(row.sessionId as string, row.path);
    return leads.map((l) => ({ ...l, exitPage: l.sessionId ? (lastPathBySession.get(l.sessionId) ?? null) : null }));
  }

  // CSV of every lead's contact info + the last page they were viewing
  // before they left — for uploading as a custom audience to an ad platform
  // or importing into an email tool for a "you were looking at X" follow-up
  // campaign. `sanitizeCsvCell` mirrors CareersService's own CSV export —
  // same formula-injection defense (a cell starting with =/+/-/@ opened in
  // Excel/Sheets can execute as a formula), so it's duplicated here rather
  // than imported across modules to keep the two export features
  // independent of each other.
  async exportCsv(status?: LeadStatus, source?: string): Promise<string> {
    const leads = await this.findAll(status, source);
    const header = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Service of Interest', 'Last Page Viewed', 'Submitted At'];
    const rows = leads.map((l) => [
      l.name,
      l.email,
      l.phone ?? '',
      l.company ?? '',
      l.source,
      l.status,
      l.serviceOfInterest ?? '',
      l.exitPage ?? '',
      l.createdAt.toISOString(),
    ]);
    return [header, ...rows]
      .map((row) => row.map((cell) => LeadsService.sanitizeCsvCell(String(cell))).join(','))
      .join('\n');
  }

  private static sanitizeCsvCell(value: string): string {
    const escaped = value.replace(/"/g, '""');
    const needsFormulaGuard = /^[=+\-@]/.test(escaped);
    const guarded = needsFormulaGuard ? `'${escaped}` : escaped;
    return `"${guarded}"`;
  }

  // Counts per pipeline stage, for the dashboard's "Leads Pipeline" widget.
  async pipelineSummary() {
    const statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];
    const counts = await Promise.all(
      statuses.map((status) => this.prisma.lead.count({ where: { status } })),
    );
    return statuses.reduce((acc, status, i) => ({ ...acc, [status]: counts[i] }), {} as Record<LeadStatus, number>);
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: { branch: true } });
    if (!lead) throw new NotFoundException('Lead not found.');
    return lead;
  }

  // The page-view trail (Admin → Analytics tracks these under the same
  // sessionId) that led up to this lead converting — powers a "Browsing
  // History" panel on a lead's detail view so a follow-up call can open
  // with "I saw you were looking at our VAT services..." instead of
  // guessing. Empty when the lead has no sessionId (an older lead from
  // before this feature, or a source that doesn't send one, e.g. WhatsApp).
  async journey(id: string) {
    const lead = await this.findOne(id);
    if (!lead.sessionId) return { lead, pageViews: [] as any[] };
    const pageViews = await this.prisma.pageView.findMany({
      where: { sessionId: lead.sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return { lead, pageViews };
  }

  async updateStatus(id: string, status: LeadStatus) {
    await this.findOne(id);
    return this.prisma.lead.update({ where: { id }, data: { status } });
  }

  async assign(id: string, assignedToId: string) {
    await this.findOne(id);
    return this.prisma.lead.update({ where: { id }, data: { assignedToId } });
  }
}
