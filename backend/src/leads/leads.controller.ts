import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { LeadStatus } from '@prisma/client';
import { LeadsService } from './leads.service';
import { AssignLeadDto, CreateLeadDto, UpdateLeadStatusDto } from './dto/lead.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  // Public: the contact form, consultation form, and chatbot all post here.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  // --- Admin CRM screen ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get()
  findAll(
    @Query('status') status?: LeadStatus,
    @Query('source') source?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.leadsService.findAll(status, source, assignedToId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('pipeline-summary')
  pipelineSummary() {
    return this.leadsService.pipelineSummary();
  }

  // Every lead's contact info plus the last page they were viewing before
  // they left (Admin → Leads → "Export for follow-up") — a ready-to-upload
  // list for an ad platform's custom-audience import or an email tool's
  // "you were looking at X" retargeting campaign. Declared before the
  // `:id` route below so "export.csv" is never swallowed as a lead id.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('export.csv')
  async exportCsv(
    @Query('status') status: LeadStatus | undefined,
    @Query('source') source: string | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.leadsService.exportCsv(status, source);
    res.header('Content-Type', 'text/csv');
    res.attachment('leads-for-follow-up.csv');
    res.send(csv);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  // This lead's page-view trail (joined by the analytics sessionId the
  // form submission carried in), for the "Browsing History" panel on its
  // detail view.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get(':id/journey')
  journey(@Param('id') id: string) {
    return this.leadsService.journey(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
    return this.leadsService.updateStatus(id, dto.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignLeadDto) {
    return this.leadsService.assign(id, dto.assignedToId);
  }
}
