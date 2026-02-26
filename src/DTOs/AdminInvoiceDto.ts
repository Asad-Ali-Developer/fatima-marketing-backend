import {
  IsString,
  IsNotEmpty,
  Matches,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  IsIn,
} from 'class-validator';
import { Lead } from 'src/schemas';

export class CreateAdminInvoiceDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  amount?: string;

  @IsString()
  @IsOptional()
  invoice_number?: string;

  @IsString()
  @IsOptional()
  lead_id?: string;

  @IsString()
  @IsOptional()
  quantity?: string;

  @IsString()
  @IsOptional()
  property_type?: string;

  @IsDateString()
  date: string;

  @IsString()
  status: 'pending' | 'received_so' | 'completed';

  generatedByLead?: Lead;
}

export class UpdateAdminInvoiceDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(03\d{9})$/, {
    message:
      'Phone number must be a valid Pakistani mobile number starting with 03 (e.g., 03001234567)',
  })
  phoneNumber: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  date: string;

  @IsString()
  status: 'pending' | 'received_so' | 'completed';
}

export class UpdateAdminInvoiceApprovalDto {
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  admin_approval_status: 'pending' | 'approved' | 'rejected';
}

export class UpdateAdminInvoiceRemarksDto {
  @IsString()
  @IsOptional()
  remarks?: string;
}
