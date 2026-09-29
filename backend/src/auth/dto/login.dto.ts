import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MaxLength(200) // generous ceiling — just guards against a junk/pasted-file-sized payload, not a real password length limit
  password: string;

  // Required on the second call once the server responds mfaRequired: true
  @IsOptional()
  @IsString()
  @MaxLength(10)
  mfaCode?: string;
}
