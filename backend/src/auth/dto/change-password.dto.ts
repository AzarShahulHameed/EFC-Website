import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ConfirmPasswordChangeDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code sent to your email.' })
  otp: string;

  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters.' })
  @MaxLength(72, { message: 'Password must be 72 characters or fewer.' })
  newPassword: string;
}
