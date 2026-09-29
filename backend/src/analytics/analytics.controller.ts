import { Body, Controller, Get, Headers, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { RecordPageViewDto } from './dto/record-pageview.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { parseBrowser, parseDevice } from './user-agent.util';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  // Public, unauthenticated — the site itself calls this on every page
  // load (see PageViewTracker.tsx on the frontend). Always 204/201, never
  // surfaces an error to the visitor even if writing fails. Device/browser
  // are parsed here from the request's own User-Agent header rather than
  // trusting anything the client claims to be, so the browser never has to
  // send that string itself.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('pageview')
  @HttpCode(204)
  async record(@Body() dto: RecordPageViewDto, @Headers('user-agent') userAgent?: string) {
    try {
      await this.analyticsService.record(dto, parseDevice(userAgent), parseBrowser(userAgent));
    } catch {
      // Best-effort — a dropped page view is not worth a broken page.
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('summary')
  summary(@Query('days') days?: string) {
    const parsed = days ? parseInt(days, 10) : 30;
    return this.analyticsService.summary(Number.isFinite(parsed) && parsed > 0 ? parsed : 30);
  }

  // Leads joined back to their browsing session, plus the auto-generated
  // "key insights" summary — the Analytics page's "Leads & Key Insights"
  // panel.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('lead-insights')
  leadInsights(@Query('days') days?: string) {
    const parsed = days ? parseInt(days, 10) : 30;
    return this.analyticsService.leadInsights(Number.isFinite(parsed) && parsed > 0 ? parsed : 30);
  }
}
