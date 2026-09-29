import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// Every signed-in admin (any role) can see and dismiss notifications —
// unlike the Audit Log, this isn't sensitive data, just "something
// happened" pointers back to the relevant screen.
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  findRecent(@Query('limit') limit?: string) {
    return this.notifications.findRecent(limit ? Number(limit) : undefined);
  }

  @Get('unread-count')
  unreadCount() {
    return this.notifications.unreadCount();
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }

  @Patch('mark-all-read')
  markAllRead() {
    return this.notifications.markAllRead();
  }
}
