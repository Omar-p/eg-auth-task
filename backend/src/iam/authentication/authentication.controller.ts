import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service';
import { SignUpDto } from './dto/sign-up.dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto/sign-in.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { DeviceInfo } from './decorators/device-info.decorator';
import { RefreshTokenFromCookie } from './decorators/refresh-token.decorator';
import { AuthResponseInterceptor } from './interceptors/auth-response.interceptor';
import { AuthUser } from './interfaces/auth-user.interface';

@ApiTags('Authentication')
@Controller('/api/auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('/sign-up')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    schema: {
      example: {
        message: 'User created successfully',
        userId: '507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authenticationService.signUp(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/sign-in')
  @Public()
  @UseInterceptors(AuthResponseInterceptor)
  @ApiOperation({ summary: 'Sign in user' })
  @ApiResponse({
    status: 200,
    description: 'Successfully signed in',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  signIn(
    @Body() signInDto: SignInDto,
    @DeviceInfo() deviceInfo: { userAgent?: string; ip?: string },
  ) {
    return this.authenticationService.signIn(signInDto, deviceInfo);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/refresh')
  @Public()
  @UseInterceptors(AuthResponseInterceptor)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiBody({
    description: 'Refresh token (can also be sent via HTTP-only cookie)',
    schema: {
      example: {
        refreshToken: 'abc123def456...',
      },
    },
  })
  refreshTokens(
    @RefreshTokenFromCookie() refreshToken: string,
    @DeviceInfo() deviceInfo: { userAgent?: string; ip?: string },
  ) {
    return this.authenticationService.refreshTokens(refreshToken, deviceInfo);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  @Public()
  @UseInterceptors(AuthResponseInterceptor)
  @ApiOperation({ summary: 'Logout user (single device)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiBody({
    description: 'Refresh token (can also be sent via HTTP-only cookie)',
    schema: {
      example: {
        refreshToken: 'abc123def456...',
      },
    },
  })
  logout(@RefreshTokenFromCookie() refreshToken: string) {
    return this.authenticationService.logout(refreshToken);
  }

  @Delete('/logout-all')
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out from all devices',
    schema: {
      example: {
        message: 'Logged out from 3 devices',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logoutFromAllDevices(@CurrentUser() user: AuthUser) {
    return this.authenticationService.logoutFromAllDevices(user.id);
  }
}
