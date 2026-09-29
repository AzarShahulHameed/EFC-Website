import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

// See the identical comment in leads/dto/lead.dto.ts — kept in sync there.
const PHONE_PATTERN = /^[0-9+\-\s()]{7,30}$/;

// Guards against a client sending an oversized `answers` blob (custom-field
// values for job applications) — this field is free-form JSON by design, so
// class-validator's normal string/length decorators don't apply; this caps
// its serialized size instead.
function MaxJsonSize(maxBytes: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxJsonSize',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null) return true;
          try {
            return Buffer.byteLength(JSON.stringify(value), 'utf8') <= maxBytes;
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return `answers is too large (max ${maxBytes} bytes)`;
        },
      },
    });
  };
}

export class CreateJobOpeningDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title: string;

  @IsString()
  @MaxLength(120)
  department: string;

  @IsString()
  @MaxLength(120)
  location: string;

  @IsString()
  @MaxLength(60)
  employmentType: string;

  @IsString()
  @MaxLength(8000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  responsibilities?: string; // newline-separated bullets

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  qualifications?: string; // newline-separated bullets

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsDateString()
  closesAt?: string;
}

export class UpdateJobOpeningDto extends PartialType(CreateJobOpeningDto) {}

export class CreateJobApplicationDto {
  @IsString()
  jobId: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters.' })
  @MaxLength(120)
  fullName: string;

  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Enter a valid phone number.' })
  phone?: string;

  @IsString()
  @IsUrl({}, { message: 'Resume must be uploaded first — resumeUrl is not a valid URL.' })
  resumeUrl: string; // upload via /media first, then submit the returned URL

  @IsOptional()
  @IsString()
  @MaxLength(6000)
  coverLetter?: string;

  @IsOptional()
  @IsObject()
  @MaxJsonSize(20_000, { message: 'answers payload is too large.' })
  answers?: Record<string, unknown>; // { [fieldId]: value } for admin-configured custom fields
}

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
