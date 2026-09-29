import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';

export class RequestEmailChangeDto {
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  newEmail: string;
}

export class ConfirmEmailChangeDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code sent to your new email.' })
  otp: string;
}
