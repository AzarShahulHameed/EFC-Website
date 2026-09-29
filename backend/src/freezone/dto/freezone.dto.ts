import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

// Other-language overrides on top of the base English badge/headline/body/
// ctaLabel above — see the comment on FreezoneApprovalTranslation in
// schema.prisma. Sent only via PATCH (create() always seeds the English
// base row directly), one entry per language being saved.
export class FreezoneApprovalTranslationDto {
  @IsString()
  languageCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  badge?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  ctaLabel?: string;
}

export class CreateFreezoneApprovalDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  badge?: string;

  @IsString()
  @MaxLength(160)
  headline: string;

  @IsString()
  @MaxLength(1000)
  body: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  ctaHref?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsIn(['top', 'center', 'bottom'])
  imagePosition?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsIn(['left', 'right'])
  mediaPosition?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFreezoneApprovalDto extends PartialType(CreateFreezoneApprovalDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FreezoneApprovalTranslationDto)
  translations?: FreezoneApprovalTranslationDto[];
}
