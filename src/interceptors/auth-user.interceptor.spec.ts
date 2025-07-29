import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AuthUserInterceptor } from './auth-user.interceptor';
import { UserService } from '../modules/user/services';
import { createMockUser } from '../test-utils';

describe('AuthUserInterceptor', () => {
  let interceptor: AuthUserInterceptor;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const mockUserService = {
      getUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthUserInterceptor,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    interceptor = module.get<AuthUserInterceptor>(AuthUserInterceptor);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should add user to request', async () => {
      const mockUser = createMockUser();
      const mockRequest = {
        user: { uuid: 'user-uuid' },
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;
      const mockCallHandler = {
        handle: () => of('test'),
      } as CallHandler;

      userService.getUser.mockResolvedValue(mockUser);

      await interceptor.intercept(mockContext, mockCallHandler);

      expect(userService.getUser).toHaveBeenCalledWith({ uuid: 'user-uuid' });
      expect(mockRequest.user).toBe(mockUser);
    });
  });
});
