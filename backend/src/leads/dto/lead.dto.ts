import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { LeadSource, LeadStatus } from '@prisma/client';

// A loose but useful international phone check — digits, spaces, and
// + ( ) - only, 7-30 characters. Rejects obvious junk ("asdf", a pasted
// sentence) without being strict enough to bounce a real number in any
// country's format. 30 (not a US-style fixed 10 or a tighter 20) leaves
// room for a dial-code-prefixed, formatted number like "+1876 555 1234" —
// a longer dial code plus a fully punctuated national number can run past
// 20 characters even though the number itself is perfectly valid.
const PHONE_PATTERN = /^[0-9+\-\s()]{7,30}$/;

export class CreateLeadDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters.' })
  @MaxLength(120, { message: 'Name must be 120 characters or fewer.' })
  name: string;

  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Enter a valid phone number.' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  serviceOfInterest?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000, { message: 'Message must be 4000 characters or fewer.' })
  message?: string;

  @IsEnum(LeadSource)
  source: LeadSource;

  @IsOptional()
  @IsString()
  branchId?: string;

  // The submitting visitor's analytics session id (see PageView.sessionId) —
  // optional, only ever an opaque per-tab string generated client-side, so
  // no format to validate beyond a sane max length.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sessionId?: string;
}

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;
}

export class AssignLeadDto {
  @IsString()
  assignedToId: string;
}
