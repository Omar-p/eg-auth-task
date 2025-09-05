import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigType } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import jwtConfig from '../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {
    if (!jwtConfiguration.secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfiguration.secret,
      audience: jwtConfiguration.audience,
      issuer: jwtConfiguration.issuer,
    });
  }

  validate(payload: JwtPayload) {
    // Trust the JWT payload - no database lookup needed
    // JWT is already verified by passport-jwt
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}
