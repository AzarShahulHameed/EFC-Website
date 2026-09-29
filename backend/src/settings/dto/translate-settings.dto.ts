import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTranslateSettingsDto {
  // Left empty on update = "keep the existing key" — same reasoning as
  // UpdateCloudinarySettingsDto.apiSecret.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  apiKey?: string;
}
