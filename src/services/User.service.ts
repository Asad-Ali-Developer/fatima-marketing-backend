import * as bcrypt from 'bcrypt';
import 'dotenv/config';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import {
  LoginUserDto,
  RegisterAdminDto,
  RegisterSalesOfficerDto,
  RegisterUserDto,
  UpdateSalesOfficerDto,
  UpdateUserDto,
  UpdateUserProfileDto,
} from 'src/DTOs';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { User, UserDocument, UserSchema } from 'src/schemas';
import { isValidBase64 } from 'src/utils';

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
      // Check if the user already exists
      const existingUser = await this.userModel
        .findOne({ email: { $eq: email } })
        .exec();

      if (existingUser) {
        throw new ConflictException('A user with this email already exists.');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password as string, 10);

      // Create the user
      const newUser = new this.userModel({
        ...registerUserDto,
        password: hashedPassword,
      });

      // Save the user to the database
      const savedUser = await newUser.save();

      console.log('Saved User: ', savedUser);

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
   * Registers a new user in the database.
   * @param registerAdminDto - Data transfer object containing user registration data.
   * @returns The registered user's data (excluding the password).
   */
  async registerAdmin(
    userId: string,
    registerAdminDto: RegisterAdminDto,
  ): Promise<any> {
    const { email, full_name, showPassword } = registerAdminDto;
    const foundUser = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();

    if (!foundUser) {
      throw new NotFoundException('Super Admin Not found!');
    }

    if (foundUser.role?.role_type !== 'super_admin') {
      throw new UnauthorizedException('Only Super Admin can register Admin');
    }

    // 🔒 Validate required fields
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    if (
      !full_name ||
      typeof full_name !== 'string' ||
      full_name.trim() === ''
    ) {
      throw new BadRequestException('Full name is required');
    }

    try {
      const existingUser = await this.userModel
        .findOne({ email: { $eq: email } })
        .exec();

      if (existingUser) {
        throw new ConflictException('A user with this email already exists.');
      }

      const createdBy = {
        id: foundUser._id,
        email: foundUser.email,
        role: foundUser.role,
        name: foundUser.full_name,
      };

      // Hash the password
      const hashedPassword = await bcrypt.hash(showPassword as string, 10);

      const newUser = new this.userModel({
        ...registerAdminDto,
        password: hashedPassword,
        showPassword: showPassword as string,
        created_by: createdBy,
      });

      const savedUser = await newUser.save();

      return {
        ...savedUser.toObject(),
        showPassword,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      console.error('Error while registering user:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while registering the user.',
      );
    }
  }

  /**
   * Registers a new user in the database.
   * @param registerSalesOfficerDto - Data transfer object containing user registration data.
   * @returns The registered user's data (excluding the password).
   */
  async registerSalesOfficer(
    userId: string,
    registerSalesOfficerDto: RegisterSalesOfficerDto,
  ): Promise<any> {
    const { email, full_name, showPassword, gender, commissionedBy, rokra } =
      registerSalesOfficerDto;

    const foundUser = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();

    if (!foundUser) {
      throw new NotFoundException('Super Admin Not found!');
    }

    const allowedRoles = ['super_admin', 'admin'];
    if (!allowedRoles.includes(foundUser.role?.role_type!)) {
      throw new UnauthorizedException(
        'Only Super Admin or Admin can register Admin',
      );
    }

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    if (
      !full_name ||
      typeof full_name !== 'string' ||
      full_name.trim() === ''
    ) {
      throw new BadRequestException('Full name is required');
    }

    try {
      const existingUser = await this.userModel
        .findOne({ email: { $eq: email } })
        .exec();

      if (existingUser) {
        throw new ConflictException('A user with this email already exists.');
      }

      const createdBy = {
        gender,
        commissionedBy,
        id: foundUser._id,
        email: foundUser.email,
        role: foundUser.role,
        name: foundUser.full_name,
      };

      // Hash the password
      const hashedPassword = await bcrypt.hash(showPassword as string, 10);

      const newUser = new this.userModel({
        ...registerSalesOfficerDto,
        rokra: rokra,
        password: hashedPassword,
        showPassword: showPassword as string,
        created_by: createdBy,
      });

      const savedUser = await newUser.save();

      return {
        ...savedUser.toObject(),
        showPassword,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
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
        id: user._id.toString(), // ✅ string
        sub: user._id.toString(), // ✅ string
        email: user.email,
        role: user.role?.role_type,
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: 'fatima-marketing-rehan',
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
    // console.log('User:', user);
    const foundUser = await this.userModel
      .findById(user.userId)
      .exec();
    if (!foundUser) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User details retrieved', data: foundUser };
  }

  async getUserDetailsByEmail(email: string) {
    // console.log('User:', user);
    const foundUser = await this.userModel
      .findOne({ email })
      .exec();
    if (!foundUser) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User details retrieved', foundUser };
  }

  public async getUserDetailsById(userId: string) {
    // console.log('User:', user);
    const foundUser = await this.userModel
      .findById(userId)
      .exec();
    if (!foundUser) {
      throw new NotFoundException('User not found');
    }
    return foundUser;
  }

  /**
   * Retrieves all users with the role of 'sales_officer'.
   * @returns Array of sales officers (without password field)
   */
  async getSalesOfficers(): Promise<UserDocument[]> {
    try {
      const salesOfficers = await this.userModel
        .find({ 'role.role_type': 'sales_officer' })
        .select('-password')
        .exec();

      return salesOfficers;
    } catch (error) {
      console.error('Error fetching sales officers:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve sales officers.',
      );
    }
  }

  async updateProfileImage(
    userId: string,
    updateUserDto: UpdateUserProfileDto,
  ): Promise<any> {
    const { profileImage } = updateUserDto;

    // Find user
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Handle profile image
    if (profileImage !== undefined) {
      if (profileImage === null || profileImage === '') {
        user.profileImage = undefined; // Clear image
      } else {
        // Optional: validate Base64
        if (!isValidBase64(profileImage)) {
          throw new BadRequestException('Invalid Base64 image format');
        }
        // Optional: limit size (e.g., max 500KB → ~680k chars)
        if (profileImage.length > 700_000) {
          throw new BadRequestException('Image too large (max 500KB)');
        }
        user.profileImage = profileImage;
      }
    }

    const updatedUser = await user.save();
    const { password, ...safeUser } = updatedUser.toObject();
    return safeUser;
  }

  /**
   * Updates an existing sales officer's details.
   * @param updaterId - ID of the user performing the update (must be super_admin or admin).
   * @param salesOfficerId - ID of the sales officer to update.
   * @param updateDto - Partial data to update.
   * @returns Updated sales officer data (excluding password).
   */
  async updateSalesOfficer(
    updaterId: string,
    salesOfficerId: string,
    updateDto: UpdateSalesOfficerDto, // Reused since fields match; consider renaming to UpdateSalesOfficerDto if needed
  ): Promise<any> {
    // 1. Validate updater
    const updater = await this.userModel
      .findById(updaterId)
      .select('-password')
      .exec();
    if (!updater) {
      throw new NotFoundException('Updater not found');
    }

    const allowedRoles = ['super_admin', 'admin'];
    if (!allowedRoles.includes(updater.role?.role_type!)) {
      throw new UnauthorizedException(
        'Only Super Admin or Admin can update a Sales Officer',
      );
    }

    // 2. Find target sales officer
    const salesOfficer = await this.userModel.findById(salesOfficerId).exec();
    if (!salesOfficer) {
      throw new NotFoundException('Sales Officer not found');
    }

    // Ensure we're only updating a sales officer
    if (salesOfficer.role?.role_type !== 'sales_officer') {
      throw new BadRequestException('Target user is not a Sales Officer');
    }

    const { email, full_name, gender, commissionedBy, rokra, status } =
      updateDto;

    // 3. Validate critical fields if provided
    if (full_name !== undefined) {
      if (typeof full_name !== 'string' || full_name.trim() === '') {
        throw new BadRequestException('Full name must be a non-empty string');
      }
    }

    if (email !== undefined) {
      // Check for email uniqueness (exclude current user)
      const existingUser = await this.userModel
        .findOne({
          email: { $eq: email },
          _id: { $ne: salesOfficerId },
        })
        .exec();

      if (existingUser) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    // 4. Prepare update object
    const updateFields: any = {};
    if (full_name !== undefined) updateFields.full_name = full_name;
    if (gender !== undefined) updateFields.gender = gender;
    if (commissionedBy !== undefined)
      updateFields.commissionedBy = commissionedBy;
    if (rokra !== undefined) updateFields.rokra = rokra;
    if (status !== undefined) updateFields.status = status;

    // Handle password update (optional)
    if (updateDto.showPassword) {
      const hashedPassword = await bcrypt.hash(updateDto.showPassword, 10);
      updateFields.password = hashedPassword;
      updateFields.showPassword = updateDto.showPassword; // store plain for display if needed
    }

    // 5. Perform update
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        salesOfficerId,
        { $set: updateFields },
        { new: true, runValidators: true },
      )
      .select('-password')
      .exec();

    return updatedUser?.toObject() || null;
  }

  async updateUser(
    userId: string,
    updateData: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const {
      full_name,
      profileImage,
      showPassword,
      commissionedBy,
      status,
      gender,
      salary,
    } = updateData;

    // Apply updates using .set()
    if (full_name !== undefined) user.set('full_name', full_name);
    if (gender !== undefined) user.set('gender', gender);
    if (profileImage !== undefined) user.set('profileImage', profileImage);
    if (salary !== undefined) user.set('salary', salary); // ✅ explicit
    if (commissionedBy !== undefined)
      user.set('commissionedBy', commissionedBy);
    if (status !== undefined) user.set('status', status);

    // Handle password separately
    if (showPassword !== undefined) {
      const hashedPassword = await bcrypt.hash(showPassword, 12);
      user.set('password', hashedPassword);
      user.set('showPassword', showPassword); // if you want to store it
    }

    const savedUser = await user.save();
    console.log('Final saved user salary:', savedUser.salary); // debug
    return savedUser;
  }

  async deleteUser(
    requestingUserId: string, // The user making the request (must be super_admin)
    targetUserId: string, // The SO to delete
  ): Promise<void> {
    // 1. Find the user making the request
    const requester = await this.userModel.findById(requestingUserId).exec();
    if (!requester) {
      throw new NotFoundException('Requesting user not found');
    }

    // 2. Only super_admin can delete
    if (requester.role?.role_type !== 'super_admin') {
      throw new ForbiddenException(
        'Only Super Admin can delete sales officers',
      );
    }

    // 3. Find the target user (SO)
    const targetUser = await this.userModel.findById(targetUserId).exec();
    if (!targetUser) {
      throw new NotFoundException('Sales officer not found');
    }

    // 4. Ensure target is a sales_officer (not admin/super_admin)
    if (targetUser.role?.role_type !== 'sales_officer') {
      throw new BadRequestException(
        'Only sales officers can be deleted via this endpoint',
      );
    }

    // 5. Prevent self-deletion (optional but safe)
    if (targetUserId === requestingUserId) {
      throw new ForbiddenException('Super Admin cannot delete themselves');
    }

    // 6. Delete the user
    await this.userModel.findByIdAndDelete(targetUserId).exec();
  }
}
