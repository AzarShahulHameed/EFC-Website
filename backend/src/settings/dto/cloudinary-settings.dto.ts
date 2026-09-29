import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateCloudinarySettingsDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/i, { message: 'cloudName looks wrong — it should just be your Cloudinary cloud name, no URL or slashes.' })
  @MaxLength(100)
  cloudName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apiKey?: string;

  // Left empty on update = "keep the existing secret" (see
  // CloudinarySettingsService.update) — same reasoning as
  // UpdateEmailSettingsDto.smtpPass.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  apiSecret?: string;
}

export class CloudinarySignatureDto {
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-zA-Z0-9/_-]+$/, { message: 'folder must be a simple path of letters, numbers, hyphens, underscores and slashes.' })
  folder: string;
}
