import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateSubServiceDto, UpdateSubServiceDto } from './dto/sub-service.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  // --- Public (consumed by the Next.js site) ---

  @Get()
  findAllPublic(@Query('lang') lang?: string) {
    return this.servicesService.findAllPublic(lang);
  }

  @Get(':slug')
  findOnePublic(@Param('slug') slug: string, @Query('lang') lang?: string) {
    return this.servicesService.findOnePublic(slug, lang);
  }

  // --- Admin (Services module of the dashboard) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/all')
  findAllAdmin() {
    return this.servicesService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.servicesService.findOneAdmin(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin')
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.servicesService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  // --- Sub-services (admin) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin/:serviceId/sub-services')
  createSubService(@Param('serviceId') serviceId: string, @Body() dto: CreateSubServiceDto) {
    return this.servicesService.createSubService(serviceId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/sub-services/:id')
  updateSubService(@Param('id') id: string, @Body() dto: UpdateSubServiceDto) {
    return this.servicesService.updateSubService(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Delete('admin/sub-services/:id')
  removeSubService(@Param('id') id: string) {
    return this.servicesService.removeSubService(id);
  }
}
