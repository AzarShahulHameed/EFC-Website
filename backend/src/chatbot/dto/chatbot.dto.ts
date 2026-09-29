import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ChatRole } from '@prisma/client';

export class FaqTranslationDto {
  @IsString()
  languageCode: string;

  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class CreateFaqDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  @ValidateNested({ each: true })
  @Type(() => FaqTranslationDto)
  @ArrayMinSize(1)
  translations: FaqTranslationDto[];
}

export class UpdateFaqDto extends PartialType(CreateFaqDto) {}

export class LogMessageDto {
  @IsString()
  @MaxLength(200)
  sessionId: string;

  @IsEnum(ChatRole)
  role: ChatRole;

  @IsString()
  @MaxLength(2000)
  content: string;
}

export class EscalateConversationDto {
  @IsString()
  @MaxLength(200)
  sessionId: string;

  // Optional — when the visitor leaves their details on "talk to a
  // person", these are attached to the conversation (so the admin
  // conversations list shows exactly who asked) and turned into a Lead in
  // the CRM, same as any other inquiry.
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
}
