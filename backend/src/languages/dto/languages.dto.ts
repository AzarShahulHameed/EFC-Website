import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

// Content blocks store whatever shape the page needs — a plain object for
// something like the Hero section, but a *array* for list-style sections
// (Stats, Trust Strip, Why Choose Us, Industries, Values, Timeline, Nav
// Links, etc., all built with parseRows/parseLines on the frontend).
// class-validator's built-in @IsObject() explicitly rejects arrays
// (`typeof value === 'object' && !Array.isArray(value)`), which was
// rejecting every one of those list-shaped saves with "data must be an
// object" even though the payload was perfectly valid JSON. This decorator
// accepts any non-null object *or* array, since content-blocks.service just
// stores it as JSON either way.
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

export class UpsertLanguageDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isRTL?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpsertTranslationDto {
  @IsString()
  key: string;

  @IsString()
  languageCode: string;

  @IsString()
  value: string;
}

export class UpsertContentBlockDto {
  @IsString()
  page: string;

  @IsString()
  section: string;

  @IsString()
  languageCode: string;

  @IsObjectOrArray()
  data: Record<string, unknown> | unknown[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

// Auto-translate (Admin → any translatable form's "Auto-translate" button):
// takes a flat map of field-name -> English text and returns the same map
// translated into `targetLanguage`, via Google Cloud Translation API.
export class TranslateBatchDto {
  @IsObject()
  texts: Record<string, string>;

  @IsString()
  targetLanguage: string;

  // Which of the keys in `texts` contain HTML (from RichTextField) rather
  // than plain text — translated with format:"html" so markup survives.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  htmlKeys?: string[];

  // Which admin screen is calling this — purely for the Translate Settings
  // usage/cost KPI breakdown (see TranslateSettingsService.getUsage()).
  // Defaults to "manual" (the click-to-translate button) in the service if
  // omitted.
  @IsOptional()
  @IsString()
  source?: string;
}
