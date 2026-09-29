import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class TestimonialTranslationDto {
  @IsString()
  languageCode: string;

  @IsString()
  quote: string;
}

export class CreateTestimonialDto {
  @IsString()
  clientName: string;

  @IsOptional()
  @IsString()
  clientTitle?: string;

  @IsOptional()
  @IsString()
  clientPhotoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  @ValidateNested({ each: true })
  @Type(() => TestimonialTranslationDto)
  @ArrayMinSize(1)
  translations: TestimonialTranslationDto[];
}

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}
