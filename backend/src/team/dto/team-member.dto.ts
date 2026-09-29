import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// See the identical comment in leads/dto/lead.dto.ts — kept in sync there.
const PHONE_PATTERN = /^[0-9+\-\s()]{7,30}$/;

export class TeamMemberTranslationDto {
  @IsString()
  languageCode: string;

  @IsString()
  @MaxLength(160)
  position: string;

  @IsString()
  @MaxLength(6000)
  bio: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialization?: string;
}

export class CreateTeamMemberDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  category?: string; // "Partner" | "Key Member"

  @IsOptional()
  @IsUrl({}, { message: 'photoUrl must be a valid URL.' })
  @MaxLength(2048)
  photoUrl?: string;

  @IsOptional()
  @IsString()
  photoPosition?: string; // "top" | "center" | "bottom"

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  // @ValidateIf (not just @IsOptional) so an admin can clear a
  // previously-set email/phone back to "" — @IsOptional only skips
  // validation for undefined/null, not an empty string, so a blank field
  // would otherwise fail @IsEmail/@Matches and the "delete" would 400
  // instead of saving. Same fix as InsightArticle.linkedinUrl.
  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email?: string;

  @ValidateIf((o) => !!o.phone)
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Enter a valid phone number.' })
  phone?: string;

  @IsOptional()
  @IsInt()
  yearsExperience?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languagesSpoken?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  @ValidateNested({ each: true })
  @Type(() => TeamMemberTranslationDto)
  @ArrayMinSize(1)
  translations: TeamMemberTranslationDto[];
}

export class UpdateTeamMemberDto extends PartialType(CreateTeamMemberDto) {}
