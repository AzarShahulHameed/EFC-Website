import { IsBoolean, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(Role, { message: 'role must be one of ADMIN, SUPER_ADMIN, EDITOR' })
  role: Role;
}

export class SetUserActiveDto {
  @IsBoolean()
  isActive: boolean;
}
