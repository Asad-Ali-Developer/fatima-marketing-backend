import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  /**
   * The full name of the user.
   * @type {string}
   * @memberof RegisterUserDto
   * @example 'John Doe'
   */
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    type: String,
  })
  full_name: string;

  /**
   * The email of the user.
   * @type {string}
   * @memberof RegisterUserDto
   * @example 'user@email.com'
   */
  @ApiProperty({
    description: 'Email of the user',
    example: 'user@email.com',
    type: String,
  })
  email: string;

  /**
   * The password of the user.
   * @type {string}
   * @memberof RegisterUserDto
   * @example 'password123'
   * */
  @ApiProperty({
    description: 'Password of the user',
    example: 'password123',
    type: String,
  })
  password: string;

  /**
   * The role of the user.
   * @type {string}
   * @memberof RegisterUserDto
   * @example 'user'
   * */
  //   @ApiProperty({
  //     description: 'Role of the user',
  //     example: 'admin',
  //     type: String,
  //   })
  //   role: string;
}

export class LoginUserDto {
  /**
   * The email of the user.
   * @type {string}
   * @memberof LoginUserDto
   * @example 'user@email.com'
   * */
  @ApiProperty({
    description: 'Email of the user',
    example: 'user@email.com',
    type: String,
  })
  email: string;

  /**
   * The password of the user.
   * @type {string}
   * @memberof LoginUserDto
   * @example 'password123'
   * */
  @ApiProperty({
    description: 'Password of the user',
    example: 'password123',
    type: String,
  })
  password: string;

  /**
   * Whether to remember the user on the device.
   * @type {boolean}
   * @memberof LoginUserDto
   * @example true
   */
  @ApiProperty({
    description: 'Remember me',
    example: true,
    type: Boolean,
    required: false,
  })
  rememberMe?: boolean;
}

export class ForgetPasswordDto {
  /**
   * The email of the user.
   * @type {string}
   * @memberof ForgetPasswordDto
   * @example 'user@email.com'
   * */
  @ApiProperty({
    description: 'Email of the user',
    example: 'user@email.com',
    type: String,
  })
  email: string;
}

export class ResetPasswordDto {
  /**
   * The token of the user.
   * @type {string}
   * @memberof ResetPasswordDto
   * @example 'Aq3fcnuwnucnwu4tviunt'
   * */
  @ApiProperty({
    description: 'Token of the user',
    example: 'w84h7fhw478hf87hw',
    type: String,
  })
  token: string;

  /**
   * New password of the user.
   * @type {string}
   * @memberof ResetPasswordDto
   * @example 'password123'
   * */
  @ApiProperty({
    description: 'New password of the user',
    example: 'password123',
    type: String,
  })
  newPassword: string;
}

export class OnboardUserDto {
  /**
   * The token of the user.
   * @type {string}
   * @memberof OnboardUserDto
   * @example 'Aq3fcnuwnucnwu4tviunt'
   * */
  @ApiProperty({
    description: 'Token of the user',
    example: 'w84h7fhw478hf87hw',
    type: String,
  })
  token: string;

  /**
   * The Workspace name of the user.
   * @type {string}
   * @memberof OnboardUserDto
   * @example 'Company Inc.'
   * */
  @ApiProperty({
    description: 'Workspace name of the user',
    example: 'Company Inc.',
    type: String,
  })
  workspace_name: string;

  /**
   * The company size of the user.
   * @type {string}
   * @memberof OnboardUserDto
   * @example 50
   * */
  @ApiProperty({
    description: 'Company size of the user',
    example: '10-49',
    type: String,
  })
  company_size: number;
}
