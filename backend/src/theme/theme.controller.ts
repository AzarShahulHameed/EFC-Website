import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { UpdateThemeDto } from './dto/theme.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('theme')
export class ThemeController {
  constructor(private themeService: ThemeService) {}

  // Public: the frontend fetches this once and applies it as CSS variables.
  @Get()
  get() {
    return this.themeService.get();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put()
  update(@Body() dto: UpdateThemeDto) {
    return this.themeService.update(dto);
  }
}
