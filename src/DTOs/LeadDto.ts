import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LeadStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

class AssignedToDto {
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

export class CreateLeadDto {
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
  time: string; // ISO date string (from frontend)

  @IsEnum(LeadStatus)
  status: LeadStatus;

  @ValidateNested()
  @Type(() => AssignedToDto)
  @IsNotEmpty()
  assignedTo: AssignedToDto;

  @ValidateNested()
  @Type(() => CreatedByDto)
  @IsNotEmpty()
  createdBy?: CreatedByDto;
}

export class UpdateLeadDto extends CreateLeadDto {}

export class UpdateLeadRemarksDto {
  @IsOptional()
  @IsString()
  remarks?: string | null;
}

export class UpdateLeadStatusDto {
  @IsOptional()
  @IsEnum(LeadStatus) // ✅ Correct validator for enum
  status: LeadStatus;
}
