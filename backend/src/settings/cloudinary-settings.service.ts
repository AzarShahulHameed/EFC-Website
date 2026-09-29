import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCloudinarySettingsDto } from './dto/cloudinary-settings.dto';

export type ResolvedCloudinarySettings = {
  cloudName?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  source: 'db' | 'env';
};

@Injectable()
export class CloudinarySettingsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // Falls back to .env if nothing's been saved from the admin dashboard
  // yet, same reasoning as EmailSettingsService.get().
  async get(): Promise<ResolvedCloudinarySettings> {
    const row = await this.prisma.cloudinarySettings.findUnique({ where: { id: 'default' } });
    if (row?.cloudName && row.apiKey && row.apiSecret) {
      return { cloudName: row.cloudName, apiKey: row.apiKey, apiSecret: row.apiSecret, source: 'db' };
    }
    return {
      cloudName: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      apiKey: this.config.get<string>('CLOUDINARY_API_KEY'),
      apiSecret: this.config.get<string>('CLOUDINARY_API_SECRET'),
      source: 'env',
    };
  }

  async getForAdmin() {
    const settings = await this.get();
    return {
      cloudName: settings.cloudName ?? '',
      apiKey: settings.apiKey ?? '',
      apiSecretSet: Boolean(settings.apiSecret),
      source: settings.source,
      configured: Boolean(settings.cloudName && settings.apiKey && settings.apiSecret),
    };
  }

  async update(dto: UpdateCloudinarySettingsDto) {
    const existing = await this.prisma.cloudinarySettings.findUnique({ where: { id: 'default' } });
    const apiSecret = dto.apiSecret && dto.apiSecret.length > 0 ? dto.apiSecret : existing?.apiSecret;

    return this.prisma.cloudinarySettings.upsert({
      where: { id: 'default' },
      update: { cloudName: dto.cloudName, apiKey: dto.apiKey, apiSecret },
      create: { id: 'default', cloudName: dto.cloudName, apiKey: dto.apiKey, apiSecret },
    });
  }
}
