import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/newsletter.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('newsletter')
export class NewsletterController {
  constructor(private newsletterService: NewsletterService) {}

  // Public — the footer's "Stay Informed" form posts here directly from
  // the browser (components/site/NewsletterForm.tsx), not via a server
  // action, so it can show an inline success/failure message without a
  // full-page redirect.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/all')
  findAllAdmin() {
    return this.newsletterService.findAllAdmin();
  }
}
