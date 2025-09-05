import { ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../interfaces/auth-user.interface';

describe('CurrentUser Decorator', () => {
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockRequest: { user?: AuthUser };

  const mockAuthUser: AuthUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    mockRequest = { user: mockAuthUser };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };
  });

  it('should extract user from request', () => {
    // Given
    const extractorFunction = (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
      return request.user;
    };

    // When
    const result = extractorFunction(undefined, mockExecutionContext);

    // Then
    expect(result).toEqual(mockAuthUser);
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });

  it('should return undefined when user not on request', () => {
    // Given
    mockRequest.user = undefined;
    const extractorFunction = (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
      return request.user;
    };

    // When
    const result = extractorFunction(undefined, mockExecutionContext);

    // Then
    expect(result).toBeUndefined();
  });

  it('should ignore data parameter', () => {
    // Given
    const extractorFunction = (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
      return request.user;
    };

    // When
    const result = extractorFunction('ignored-data', mockExecutionContext);

    // Then
    expect(result).toEqual(mockAuthUser);
  });
});
