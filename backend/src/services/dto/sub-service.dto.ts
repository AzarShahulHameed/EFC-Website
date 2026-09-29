import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { ServiceFaqDto } from './service-translation.dto';

export class CreateSubServiceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // Full page body — the rich, admin-authored content shown on this
  // sub-service's own page (can include a link, inserted via the admin
  // rich-text editor's Link tool, to redirect a reader to any other page).
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  body?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imagePosition?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Same AEO detail sections as ServiceTranslationDto — see the matching
  // comment on SubService in schema.prisma for why these live flat here
  // instead of in a translation table. All optional so an existing
  // sub-service (saved before this field set existed) isn't broken.
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  whatIsIt?: string;

  @IsOptional()
  @IsString()
  whoNeedsIt?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  process?: string;

  @IsOptional()
  @IsString()
  costFactors?: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceFaqDto)
  faqs?: ServiceFaqDto[];

  @IsOptional()
  @IsString()
  responsiblePersonId?: string;
}

// Other-language overrides on top of the base English fields above — see
// the comment on SubServiceTranslation in schema.prisma. Sent only via
// PATCH; create() always seeds the English base row directly.
export class SubServiceTranslationDto {
  @IsString()
  languageCode: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  whatIsIt?: string;

  @IsOptional()
  @IsString()
  whoNeedsIt?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  process?: string;

  @IsOptional()
  @IsString()
  costFactors?: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceFaqDto)
  faqs?: ServiceFaqDto[];
}

export class UpdateSubServiceDto extends PartialType(CreateSubServiceDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubServiceTranslationDto)
  translations?: SubServiceTranslationDto[];
}
