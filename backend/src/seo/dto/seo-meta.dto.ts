import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertSeoMetaDto {
  @IsString()
  path: string;

  @IsString()
  languageCode: string;

  @IsString()
  metaTitle: string;

  @IsString()
  metaDescription: string;

  @IsOptional()
  @IsString()
  keywords?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  ogImageUrl?: string;

  @IsOptional()
  @IsString()
  schemaType?: string; // "Organization" | "LocalBusiness" | "FAQ" | "Service" | "Article" | "Breadcrumb"

  @IsOptional()
  @IsObject()
  schemaJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  noindex?: boolean;
}
