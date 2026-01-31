import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

class RegisterStaffDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    type: String,
  })
  full_name: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'user@email.com',
    type: String,
  })
  email: string;

  // ✅ Only `showPassword` for display
  @ApiProperty({
    description: 'Auto-generated password (for display only)',
    example: 'aB3$kL9pQ2',
    type: String,
    required: false,
  })
  showPassword?: string;

  @ApiProperty({
    description: 'Gender of the user',
    example: 'male',
    enum: ['male', 'female'],
    required: false,
  })
  gender?: 'male' | 'female';

  @ApiProperty({
    description: 'Commission percentage (0–100)',
    example: 65,
    type: Number,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  commissionedBy?: number;

  @ApiProperty({
    description: 'Status of the user',
    example: 'active',
    enum: ['active', 'inactive'],
    default: 'active',
    required: false,
  })
  status?: 'active' | 'inactive';
}

// 👇 Specific DTOs (mostly for Swagger clarity)
export class RegisterAdminDto extends RegisterStaffDto {
  @ApiProperty({
    description: 'Role of the user',
    example: 'admin',
    enum: ['admin'],
    default: 'admin',
  })
  role: { role_type: 'admin' } = { role_type: 'admin' };
}

export class RegisterSalesOfficerDto extends RegisterStaffDto {
  @ApiProperty({
    description: 'Role of the user',
    example: 'sales_officer',
    enum: ['sales_officer'],
    default: 'sales_officer',
  })
  role: { role_type: 'sales_officer' } = { role_type: 'sales_officer' };
}

// 👇 Keep RegisterUserDto as-is (for regular users)
export class RegisterUserDto {
  @ApiProperty({ example: 'John Doe' })
  full_name: string;

  @ApiProperty({ example: 'user@email.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;

  @ApiProperty({ example: 'active', required: false })
  status?: 'active' | 'inactive';

  // Note: Regular users don't get commission/gender in this flow
}

export class LoginUserDto {
  @ApiProperty({ example: 'user@email.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;

  @ApiProperty({ example: true, required: false })
  rememberMe?: boolean;
}

export class UpdateUserProfileDto {
  @ApiProperty({
    description:
      'Base64-encoded JPEG/PNG profile image (without data URL prefix)',
    example: 'iVBORw0KGgoAAAANSUhEUgAA...',
    required: false,
  })
  profileImage?: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Plain-text password (will be hashed)',
    example: 'newSecurePass123',
    required: false,
  })
  @IsOptional()
  @IsString()
  showPassword?: string; // plain text — will be hashed to `password`

  @ApiProperty({ enum: ['male', 'female'], required: false })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: 'male' | 'female';

  @ApiProperty({
    description: 'Commission percentage (0–100)',
    example: 65,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionedBy?: number;

  @ApiProperty({ enum: ['active', 'inactive'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiProperty({
    description: 'Base64-encoded profile image (without data URL prefix)',
    required: false,
  })
  @IsOptional()
  @IsString()
  profileImage?: string;
}