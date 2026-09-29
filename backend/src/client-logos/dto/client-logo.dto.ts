import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateClientLogoDto {
  @IsString()
  @MaxLength(160)
  name: string;

  @IsUrl({}, { message: 'imageUrl must be a valid URL.' })
  @MaxLength(2048)
  imageUrl: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateClientLogoDto extends PartialType(CreateClientLogoDto) {}
