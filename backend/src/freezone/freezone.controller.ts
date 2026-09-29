import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FreezoneService } from './freezone.service';
import { CreateFreezoneApprovalDto, UpdateFreezoneApprovalDto } from './dto/freezone.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('freezone-approvals')
export class FreezoneController {
  constructor(private freezoneService: FreezoneService) {}

  @Get()
  findAllPublic(@Query('lang') lang?: string) {
    return this.freezoneService.findAllPublic(lang);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/all')
  findAllAdmin() {
    return this.freezoneService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin')
  create(@Body() dto: CreateFreezoneApprovalDto) {
    return this.freezoneService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.freezoneService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateFreezoneApprovalDto) {
    return this.freezoneService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.freezoneService.remove(id);
  }
}
