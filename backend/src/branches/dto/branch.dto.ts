import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsEmail, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsString()
  addressLine: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email: string;

  @IsString()
  workingHours: string;

  @IsOptional()
  @IsUrl({}, { message: 'googleMapsUrl must be a valid URL.' })
  @MaxLength(1000)
  googleMapsUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  externalUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  branchHeadId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}
