import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ServiceFaqDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class ServiceTranslationDto {
  @IsString()
  languageCode: string;

  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  // AEO detail sections — see the matching comment on ServiceTranslation
  // in schema.prisma. All optional so existing services aren't broken.
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
