import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

// A block's `content` shape depends on its `type` — `{ html }` for
// richText, `{ url, position, caption, link }` for image, an array of
// `{ url, caption }` for gallery, etc. class-validator's built-in
// `@IsObject()` rejects arrays, so (same fix already applied to
// UpsertContentBlockDto in languages/dto/languages.dto.ts) this accepts
// either shape and leaves the real validation to the frontend's per-type
// forms — the backend just stores whatever JSON it's given.
function IsObjectOrArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isObjectOrArray',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'object' && value !== null;
        },
        defaultMessage() {
          return `${propertyName} must be an object or an array`;
        },
      },
    });
  };
}

export const PAGE_BLOCK_TYPES = ['richText', 'image', 'video', 'imageText', 'cta', 'quote', 'gallery', 'spacer'] as const;

export class CreatePageBlockDto {
  @IsString()
  @MaxLength(120)
  page: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  languageCode?: string;

  @IsString()
  @MaxLength(40)
  type: string;

  @IsObjectOrArray()
  content: Record<string, unknown> | unknown[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  animation?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePageBlockDto extends PartialType(CreatePageBlockDto) {}
