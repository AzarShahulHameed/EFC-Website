import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateEmailSettingsDto {
  @IsIn(['smtp', 'resend'])
  provider: 'smtp' | 'resend';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fromName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'fromEmail must be a valid email address.' })
  @MaxLength(254)
  fromEmail?: string;

  // --- SMTP ---
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpUser?: string;

  // Left empty on update = "keep the existing password" (see
  // EmailSettingsService.update) — the admin form never round-trips the
  // real secret back to the browser, so an empty field can't mean
  // "clear it" the way it might for an ordinary text field.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  smtpPass?: string;

  // --- Resend ---
  @IsOptional()
  @IsString()
  @MaxLength(500)
  resendApiKey?: string;
}
