import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ApplicationStatus } from '@prisma/client';
import { CareersService } from './careers.service';
import {
  CreateJobApplicationDto,
  CreateJobOpeningDto,
  UpdateApplicationStatusDto,
  UpdateJobOpeningDto,
} from './dto/careers.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('careers')
export class CareersController {
  constructor(private careersService: CareersService) {}

  // --- Public: /careers page ---

  @Get('jobs')
  findOpenJobs(@Query('department') department?: string, @Query('location') location?: string) {
    return this.careersService.findOpenJobsPublic(department, location);
  }

  @Get('jobs/:id')
  findOneJob(@Param('id') id: string) {
    return this.careersService.findOneJobPublic(id);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('applications')
  submitApplication(@Body() dto: CreateJobApplicationDto) {
    return this.careersService.submitApplication(dto);
  }

  // --- Admin ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/jobs')
  findAllJobsAdmin() {
    return this.careersService.findAllJobsAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin/jobs')
  createJob(@Body() dto: CreateJobOpeningDto) {
    return this.careersService.createJob(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/jobs/:id')
  updateJob(@Param('id') id: string, @Body() dto: UpdateJobOpeningDto) {
    return this.careersService.updateJob(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/jobs/:id/close')
  closeJob(@Param('id') id: string) {
    return this.careersService.closeJob(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/applications')
  findApplications(@Query('jobId') jobId?: string) {
    return this.careersService.findApplications(jobId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/applications/:id/status')
  updateApplicationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.careersService.updateApplicationStatus(id, dto.status as ApplicationStatus, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/applications/export')
  async exportApplications(@Query('jobId') jobId: string | undefined, @Res() res: Response) {
    const csv = await this.careersService.exportApplicationsCsv(jobId);
    res.header('Content-Type', 'text/csv');
    res.attachment('applications.csv');
    res.send(csv);
  }
}
