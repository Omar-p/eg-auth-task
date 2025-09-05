import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypt.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import jwtConfig from './config/jwt.config';
import { User, UserSchema } from './entities/user.entity';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './entities/refresh-token.entity';
import { CommonModule } from '../common/comon.module';

import { JwtStrategy } from './authentication/strategies/jwt.strategy';
import { JwtAuthGuard } from './authentication/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './authentication/guards/optional-jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    PassportModule,
    CommonModule,
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    AuthenticationService,
    // JWT authentication providers
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  controllers: [AuthenticationController],
  exports: [
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    AuthenticationService,
    JwtModule,
  ],
})
export class IamModule {}
