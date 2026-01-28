import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsEnum(['Kanal', 'Marla'])
  @IsNotEmpty()
  areaType: 'Kanal' | 'Marla'; // ✅

  @IsNumber()
  @IsNotEmpty()
  areaSize: number; // ✅

  @IsString()
  @IsNotEmpty()
  fileType: string;
}

export class UpdateInventoryDto {
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsEnum(['Kanal', 'Marla'])
  @IsOptional()
  areaType: 'Kanal' | 'Marla';

  @IsNumber()
  @IsOptional()
  areaSize: number;

  @IsString()
  @IsOptional()
  fileType?: string;
}
