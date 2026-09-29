import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RecordPageViewDto {
  @IsString()
  @MaxLength(512)
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  languageCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  country?: string;
}
