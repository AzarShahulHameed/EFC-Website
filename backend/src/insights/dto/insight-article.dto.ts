import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export const INSIGHT_POST_TYPES = ['newsletter', 'insight', 'fun_activity'] as const;
export type InsightPostType = (typeof INSIGHT_POST_TYPES)[number];

export class CreateInsightCategoryDto {
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'slug must be lowercase, alphanumeric, hyphen-separated' })
  slug: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class InsightTranslationDto {
  @IsString()
  @MaxLength(10)
  languageCode: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(500)
  excerpt: string;

  @IsString()
  @MaxLength(50_000)
  body: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaDescription?: string;
}

export class CreateInsightArticleDto {
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'slug must be lowercase, alphanumeric, hyphen-separated' })
  slug: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(INSIGHT_POST_TYPES)
  postType?: InsightPostType;

  // `@ValidateIf` (rather than `@IsOptional`) so an empty string — which
  // is how the admin form clears a previously-set LinkedIn URL back to
  // "none" — skips the `@IsUrl` check instead of failing it; `@IsOptional`
  // alone only skips validation for `undefined`/`null`, not `""`.
  @ValidateIf((o) => !!o.linkedinUrl)
  @IsUrl({}, { message: 'linkedinUrl must be a valid URL.' })
  @MaxLength(500)
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  coverImagePosition?: string; // "top" | "center" | "bottom"

  // An uploaded video shown in place of (or above, per the admin form) the
  // cover image — same optional/independent pairing as Service.imageUrl +
  // Service.videoUrl and SubService's own imageUrl/videoUrl.
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverVideoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ValidateNested({ each: true })
  @Type(() => InsightTranslationDto)
  @ArrayMinSize(1)
  translations: InsightTranslationDto[];
}

export class UpdateInsightArticleDto extends PartialType(CreateInsightArticleDto) {}
