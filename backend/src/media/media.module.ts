import { BadRequestException, Body, Controller, Get, Injectable, Module, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { IsString } from 'class-validator';
import { CloudinarySettingsModule } from '../settings/cloudinary-settings.module';
import { CloudinarySettingsService } from '../settings/cloudinary-settings.service';
import { CloudinarySignatureDto } from '../settings/dto/cloudinary-settings.dto';

export class RequestUploadDto {
  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;
}

export class ConfirmUploadDto {
  @IsString()
  url: string;

  @IsString()
  storageKey: string;

  @IsString()
  mimeType: string;
}

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // Returns a presigned PUT URL the admin dashboard uploads directly to
  // (S3 or Azure Blob), so file bytes never pass through this API.
  //
  // TODO: replace this stub with the real AWS SDK v3 call, e.g.:
  //   const command = new PutObjectCommand({ Bucket, Key, ContentType });
  //   const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  requestUploadUrl(dto: RequestUploadDto) {
    const bucket = this.config.get<string>('S3_BUCKET') ?? 'sterling-vance-media';
    const storageKey = `uploads/${Date.now()}-${dto.fileName}`;
    return {
      uploadUrl: `https://${bucket}.s3.amazonaws.com/${storageKey}`, // presigned in production
      storageKey,
      publicUrl: `https://${bucket}.s3.amazonaws.com/${storageKey}`,
    };
  }

  confirmUpload(dto: ConfirmUploadDto, uploadedById: string) {
    return this.prisma.mediaAsset.create({
      data: { url: dto.url, storageKey: dto.storageKey, mimeType: dto.mimeType, uploadedById },
    });
  }

  list() {
    return this.prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
  }
}

@Controller('media')
export class MediaController {
  constructor(
    private mediaService: MediaService,
    private cloudinarySettings: CloudinarySettingsService,
  ) {}

  // Returns a short-lived signed-upload payload the admin dashboard's
  // Server Action (lib/cloudinary.ts's uploadToCloudinary) uses to upload
  // a file straight to Cloudinary from the Next.js server — the actual
  // API secret (whether saved in Admin → Cloudinary Settings or still in
  // this API's own .env) never has to leave this server, and the
  // frontend never needs a Cloudinary env var of its own at all anymore.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('cloudinary-signature')
  async cloudinarySignature(@Body() dto: CloudinarySignatureDto) {
    const { cloudName, apiKey, apiSecret } = await this.cloudinarySettings.get();
    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException(
        "Cloudinary isn't configured yet — set it up in Admin → Cloudinary Settings (or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET in the API's .env as a fallback).",
      );
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${dto.folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');
    return { cloudName, apiKey, timestamp, signature, folder: dto.folder };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('upload-url')
  requestUploadUrl(@Body() dto: RequestUploadDto) {
    return this.mediaService.requestUploadUrl(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('confirm')
  confirmUpload(@Body() dto: ConfirmUploadDto, @CurrentUser() user: { id: string }) {
    return this.mediaService.confirmUpload(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get()
  list() {
    return this.mediaService.list();
  }
}

@Module({
  imports: [CloudinarySettingsModule],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
