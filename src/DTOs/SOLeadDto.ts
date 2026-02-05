import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SOLeadStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

class CreatedByDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  full_name: string;
}

export class SOCreateLeadDto {
  @IsNotEmpty()
  @IsString()
  userName: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
  
  @IsOptional()
  @IsString()
  location?: string;

  @IsNotEmpty()
  @IsString()
  time: string;

  @IsEnum(SOLeadStatus)
  status: SOLeadStatus;

  @ValidateNested()
  @Type(() => CreatedByDto)
  @IsOptional()
  createdBy?: CreatedByDto;
}

export class SOUpdateLeadDto extends SOCreateLeadDto {}

export class SOUpdateLeadRemarksDto {
  @IsOptional()
  @IsString()
  remarks?: string | null;
}

export class SOUpdateLeadStatusDto {
  @IsOptional()
  @IsEnum(SOLeadStatus) // ✅ Correct validator for enum
  status: SOLeadStatus;
}
