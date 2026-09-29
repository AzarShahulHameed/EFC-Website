import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

// Self-service profile edit (Admin → My Profile) — deliberately separate
// from UpdateUserRoleDto/SetUserActiveDto in the users module: those are a
// Super Admin acting on someone else's account (role/active state), this
// is any signed-in admin editing their own display info. Never touches
// email, password, role, or isActive — those all have their own
// dedicated, OTP-guarded or role-gated flows.
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  bio?: string;

  @IsOptional()
  @IsUrl({}, { message: 'photoUrl must be a valid URL.' })
  @MaxLength(2048)
  photoUrl?: string;
}
