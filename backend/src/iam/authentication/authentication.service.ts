import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';

import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { IUser } from '../entities/user.interface';
import { IRefreshToken } from '../entities/refresh-token.interface';
import { AppLoggerService } from '../../common/services/app-logger.service';
import { MongoDBLoggerService } from '../../common/services/mongodb-logger.service';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<IUser>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<IRefreshToken>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly logger: AppLoggerService,
    private readonly mongoLogger: MongoDBLoggerService,
  ) {
    this.logger.setContext(AuthenticationService.name);
  }

  async signUp(
    signUpDto: SignUpDto,
  ): Promise<{ message: string; userId: string }> {
    const log = this.mongoLogger.logOperation('users', 'create', {
      email: signUpDto.email,
    });

    try {
      log.start();

      const hashedPassword = await this.hashingService.hash(signUpDto.password);

      const user = new this.userModel({
        email: signUpDto.email,
        name: signUpDto.name,
        password: hashedPassword,
      });

      const savedUser = await user.save();
      log.end(savedUser, 1);

      this.logger.log(
        `User registered successfully: userId=${savedUser._id.toString()}, email=${signUpDto.email}`,
      );

      return {
        message: 'User created successfully',
        userId: savedUser._id.toString(),
      };
    } catch (err) {
      log.error(err as Error);

      if (err.code === 11000) {
        this.logger.warn(
          `Registration failed - email already exists: ${signUpDto.email}`,
        );
        throw new ConflictException('Email already exists');
      }
      this.logger.error(
        `Registration failed for email: ${signUpDto.email}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async signIn(
    signInDto: SignInDto,
    deviceInfo?: { userAgent?: string; ip?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const log = this.mongoLogger.logOperation('users', 'findOne', {
      email: signInDto.email,
    });

    try {
      log.start();
      const user = await this.userModel.findOne({
        email: signInDto.email,
        isActive: true,
      });
      log.end(user, user ? 1 : 0);

      if (!user) {
        this.logger.warn(`Sign-in failed - user not found: ${signInDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordEqual = await this.hashingService.compare(
        signInDto.password,
        user.password,
      );

      if (!isPasswordEqual) {
        this.logger.warn(
          `Sign-in failed - invalid password: ${signInDto.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      await this.userModel.updateOne(
        { _id: user._id },
        { lastLoginAt: new Date() },
      );

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(
        user,
        deviceInfo,
      );

      this.logger.log(
        `User signed in successfully: userId=${user._id.toString()}, email=${signInDto.email}`,
      );

      return { accessToken, refreshToken };
    } catch (err) {
      if (!(err instanceof UnauthorizedException)) {
        log.error(err as Error);
      }
      throw err;
    }
  }

  async refreshTokens(
    refreshToken: string,
    deviceInfo?: { userAgent?: string; ip?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      this.logger.warn('Refresh token is undefined or empty');
      throw new UnauthorizedException('Invalid refresh token');
    }

    const log = this.mongoLogger.logOperation('refresh_tokens', 'findOne', {
      tokenHash: '***',
    });

    try {
      log.start();
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const storedToken = await this.refreshTokenModel
        .findOne({
          tokenHash,
          isRevoked: false,
          expiresAt: { $gt: new Date() },
        })
        .populate('userId');

      log.end(storedToken, storedToken ? 1 : 0);

      if (!storedToken) {
        this.logger.warn('Invalid or expired refresh token used');
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke the used refresh token (token rotation)
      await this.refreshTokenModel.updateOne(
        { _id: storedToken._id },
        { isRevoked: true, revokedAt: new Date() },
      );

      const user = await this.userModel.findById(storedToken.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account is not active');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokens(user, deviceInfo);

      this.logger.log(
        `Tokens refreshed successfully: userId=${user._id.toString()}`,
      );

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      if (!(err instanceof UnauthorizedException)) {
        log.error(err as Error);
      }
      throw err;
    }
  }

  async logout(
    refreshToken: string,
  ): Promise<{ message: string; clearCookie: boolean }> {
    const log = this.mongoLogger.logOperation('refresh_tokens', 'updateOne', {
      revoke: true,
    });

    try {
      log.start();
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await this.refreshTokenModel.updateOne(
        { tokenHash },
        { isRevoked: true, revokedAt: new Date() },
      );

      log.end(null, 1);

      this.logger.log('User logged out successfully');
      return { message: 'Logged out successfully', clearCookie: true };
    } catch (err) {
      log.error(err as Error);
      throw new InternalServerErrorException('Logout failed');
    }
  }

  async logoutFromAllDevices(userId: string): Promise<{ message: string }> {
    const log = this.mongoLogger.logOperation('refresh_tokens', 'updateMany', {
      userId,
    });

    try {
      log.start();
      const result = await this.refreshTokenModel.updateMany(
        { userId, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() },
      );

      log.end(null, result.modifiedCount);

      this.logger.log(
        `User logged out from all devices: userId=${userId}, devices=${result.modifiedCount}`,
      );
      return { message: `Logged out from ${result.modifiedCount} devices` };
    } catch (err) {
      log.error(err as Error);
      throw new InternalServerErrorException('Logout from all devices failed');
    }
  }

  private async generateTokens(
    user: IUser,
    deviceInfo?: { userAgent?: string; ip?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtConfiguration.secret,
      expiresIn: this.jwtConfiguration.accessTokenTtl,
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
    });

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Store refresh token in database
    const log = this.mongoLogger.logOperation('refresh_tokens', 'create');
    try {
      log.start();
      const refreshTokenDoc = new this.refreshTokenModel({
        userId: user._id.toString(),
        tokenHash,
        expiresAt: new Date(Date.now() + this.jwtConfiguration.refreshTokenTtl),
        deviceInfo: deviceInfo || {},
      });

      await refreshTokenDoc.save();
      log.end(refreshTokenDoc, 1);
    } catch (err) {
      log.error(err as Error);
      throw err;
    }

    return { accessToken, refreshToken };
  }
}
