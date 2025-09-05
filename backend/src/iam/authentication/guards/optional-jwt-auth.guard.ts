import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const result = super.canActivate(context);

    if (result instanceof Promise) {
      return result.catch(() => true);
    }

    return result as boolean;
  }

  // @ts-expect-error - Override method signature for optional auth
  handleRequest(err: unknown, user: unknown): unknown {
    return user || null;
  }
}
