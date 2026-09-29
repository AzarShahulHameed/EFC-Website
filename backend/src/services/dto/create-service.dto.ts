import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ServiceTranslationDto } from './service-translation.dto';

export class CreateServiceDto {
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  iconKey?: string;

  @IsOptional()
  @IsUrl({}, { message: 'brochureUrl must be a valid URL.' })
  @MaxLength(2048)
  brochureUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'imageUrl must be a valid URL.' })
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imagePosition?: string;

  @IsOptional()
  @IsString()
  responsiblePersonId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  @ValidateNested({ each: true })
  @Type(() => ServiceTranslationDto)
  @ArrayMinSize(1)
  translations: ServiceTranslationDto[];
}
