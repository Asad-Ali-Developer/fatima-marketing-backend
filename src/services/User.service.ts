import 'dotenv/config';
import * as bcrypt from 'bcrypt';

import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from 'src/DTOs';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { User, UserDocument, UserSchema } from 'src/schemas';

@Injectable()
export class UserService {
  private userModel: Model<UserDocument>;
  constructor(
    private readonly jwtService: JwtService,
    private databaseProvider: DatabaseProvider,
  ) {
    const connection = this.databaseProvider.getConnection();
    this.userModel = connection.model<UserDocument>(User.name, UserSchema);
  }

  /**
   * Registers a new user in the database.
   * @param registerUserDto - Data transfer object containing user registration data.
   * @returns The registered user's data (excluding the password).
   */

  async registerUser(registerUserDto: RegisterUserDto): Promise<any> {
    const { email, password } = registerUserDto;

    try {
      // Validate that the email is a business email
      const genericEmailDomains = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
      ];
      const emailDomain = email.split('@')[1];
      if (genericEmailDomains.includes(emailDomain)) {
        throw new BadRequestException(
          'Only business emails are allowed for registration.',
        );
      }

      // Check if the user already exists
      const existingUser = await this.userModel
        .findOne({ email: { $eq: email } })
        .exec();

      if (existingUser) {
        throw new ConflictException('A user with this email already exists.');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the user
      const newUser = new this.userModel({
        ...registerUserDto,
        password: hashedPassword,
      });

      // Save the user to the database
      const savedUser = await newUser.save();

      // Exclude the password from the returned user data
      const { password: _, ...userWithoutPassword } = savedUser.toObject();
      return userWithoutPassword;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        // Re-throw known validation exceptions
        throw error;
      }

      console.error('Error while registering user:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while registering the user.',
      );
    }
  }

  /**
   * Logs in a user by verifying their credentials.
   * @param loginUserDto - Data transfer object containing user login data.
   * @returns A JWT token if the login is successful.
   */
  async loginUser(
    loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string }> {
    const { email, password, rememberMe } = loginUserDto;

    try {
      // Validate that the email is a business email
    //   const genericEmailDomains = [
    //     'gmail.com',
    //     'yahoo.com',
    //     'hotmail.com',
    //     'outlook.com',
    //   ];
    //   const emailDomain = email.split('@')[1];
    //   if (genericEmailDomains.includes(emailDomain)) {
    //     throw new BadRequestException('Please use a business email to log in.');
    //   }

      // Find the user by email
      const user = await this.userModel
        .findOne({ email: { $eq: email } })
        .exec();
      if (!user) {
        throw new NotFoundException(
          'Oops! We couldn’t find an account with this email.',
        );
      }

      // Verify the password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          'Oops! Wrong email or password. Try again.',
        );
      }

      // Handle cases for Google OAuth users who do not set a password
      if (!password) {
        throw new UnauthorizedException(
          'Oops! Password is required for this account. Please reset it if you forgot.',
        );
      }

      // Generate a JWT token
      const payload = {
        email: user.email,
        sub: user._id,
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET_KEY!,
        expiresIn: rememberMe ? '30d' : '1h',
      });

      return { accessToken };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        // Re-throw known exceptions
        throw error;
      }

      console.error('Error during login:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred during login. Please try again later.',
      );
    }
  }

  async validateGoogleUser(googleUser: RegisterUserDto) {
    // Check if user with the given email already exists
    const existingUser = await this.userModel.findOne({
      email: googleUser.email,
    });

    if (existingUser) {
      // If user exists, return the existing user and access token
      const payload = { id: existingUser.id, email: existingUser.email };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken, user: existingUser };
    }

    // If user does not exist, create a new user (without password or with a default password)
    const newUser = new this.userModel({
      ...googleUser, // Spread other properties from googleUser (like email, name)
      password: '', // Optionally, leave the password empty or set a default value
    });

    try {
      // Save the new user to the database
      const savedUser = await newUser.save();

      // Generate a JWT token for the new user
      const payload = {
        id: savedUser.id,
        email: savedUser.email,
      };
      const accessToken = this.jwtService.sign(payload);

      return { accessToken, user: savedUser };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error saving the user',
        error.message,
      );
    }
  }

  /**
   * Handles Google login for a user.
   * If the user does not exist, it creates a new user and assigns a workspace.
   * If the user exists but does not have a workspace, it creates one.
   * @param user - The Google user object containing user details.
   * @returns An object containing the access token for the user.
   */
  async googleLogin(user: any): Promise<{ accessToken: string }> {
    const { email, first_name, last_name, profile_picture } = {
      email: user.email,
      first_name: user.first_name || user.given_name,
      last_name: user.last_name || user.family_name,
      profile_picture: user.profile_picture || user.picture,
    };

    try {
      if (!email) {
        throw new BadRequestException('Email is required for Google login.');
      }

      // Find existing user
      let existingUser = await this.userModel.findOne({ email }).exec();

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('google-oauth-user', 10);

        existingUser = new this.userModel({
          email,
          first_name: first_name || 'Unknown',
          last_name: last_name || '',
          profile_picture: profile_picture || '',
          password: hashedPassword,
          email_verified: true,
          workspace_email: `${first_name.toLowerCase()}@test.com`,
          workspace_id: null, // Ensure workspace_id is initially null
        });

        await existingUser.save();
      }

      const payload = {
        email: existingUser.email,
        sub: existingUser._id.toString(),
      };

      const accessToken = this.jwtService.sign(payload);

      return { accessToken };
    } catch (error) {
      console.error('Unexpected error during Google login:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred during Google login.',
      );
    }
  }

  async getUserDetails(user: any) {
    console.log("User:", user);
    const foundUser = await this.userModel
      .findById(user.userId)
      .select('-password')
      .exec();
    if (!foundUser) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User details retrieved', data: foundUser };
  }
}
