import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../../user/services/user.service';
import { UserAuthService } from '../../../user/services/user-auth.service';
import {
  UserLoginDto,
  UserRegisterDto,
  UserForgottenPasswordDto,
  UserResetPasswordDto,
} from '../../dtos';
import { UserEntity } from '../../../user/entities/user.entity';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

jest.mock('typeorm-transactional-cls-hooked', () => ({
  Transactional: () => (target: any, propertyName: string, descriptor: PropertyDescriptor) => descriptor,
  initializeTransactionalContext: jest.fn(),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let userService: UserService;
  let userAuthService: UserAuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    createToken: jest.fn(),
    handleForgottenPassword: jest.fn(),
    handleResetPassword: jest.fn(),
  };

  const mockUserService = {
    createUser: jest.fn(),
  };

  const mockUserAuthService = {
    updateLastLogoutDate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: UserAuthService,
          useValue: mockUserAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    userAuthService = module.get<UserAuthService>(UserAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('userLogin', () => {
    it('should login user with valid credentials', async () => {
      const userLoginDto: UserLoginDto = {
        pinCode: 123456,
        password: 'password123',
      };

      const mockUser = {
        uuid: 'user-uuid',
        pinCode: 123456,
        toDto: jest.fn().mockReturnValue({
          uuid: 'user-uuid',
          pinCode: 123456,
        }),
      } as any;

      const mockToken = {
        accessToken: 'jwt-token',
        expiresIn: '3600',
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.createToken.mockResolvedValue(mockToken);

      const result = await controller.userLogin(userLoginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(userLoginDto);
      expect(authService.createToken).toHaveBeenCalledWith(mockUser);
      expect(result.user).toEqual(mockUser.toDto());
      expect(result.token).toBe(mockToken);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const userLoginDto: UserLoginDto = {
        pinCode: 999999,
        password: 'wrongpassword',
      };

      mockAuthService.validateUser.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.userLogin(userLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('userRegister', () => {
    it('should register new user successfully', async () => {
      const userRegisterDto: UserRegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        currency: 'USD',
      };

      const mockUser = {
        uuid: 'user-uuid',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        toDto: jest.fn().mockReturnValue({
          uuid: 'user-uuid',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        }),
      } as any;

      mockUserService.createUser.mockResolvedValue(mockUser);

      const result = await controller.userRegister(userRegisterDto);

      expect(userService.createUser).toHaveBeenCalledWith(userRegisterDto);
      expect(result).toEqual(mockUser.toDto());
    });

    it('should throw BadRequestException for duplicate email', async () => {
      const userRegisterDto: UserRegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        currency: 'USD',
      };

      mockUserService.createUser.mockRejectedValue(
        new BadRequestException('Email already exists'),
      );

      await expect(controller.userRegister(userRegisterDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('userLogout', () => {
    it('should logout user successfully', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        userAuth: { id: 1 },
      } as UserEntity;

      mockUserAuthService.updateLastLogoutDate.mockResolvedValue(undefined);

      await controller.userLogout(mockUser);

      expect(userAuthService.updateLastLogoutDate).toHaveBeenCalledWith(
        mockUser.userAuth,
      );
    });

    it('should handle logout errors', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        userAuth: { id: 1 },
      } as UserEntity;

      mockUserAuthService.updateLastLogoutDate.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.userLogout(mockUser)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('forgetPassword', () => {
    it('should handle forgotten password request', async () => {
      const userForgottenPasswordDto: UserForgottenPasswordDto = {
        emailAddress: 'test@example.com',
        locale: 'en',
      };

      mockAuthService.handleForgottenPassword.mockResolvedValue(undefined);

      await controller.forgetPassword(userForgottenPasswordDto);

      expect(authService.handleForgottenPassword).toHaveBeenCalledWith(
        userForgottenPasswordDto,
      );
    });

    it('should throw BadRequestException for non-existent email', async () => {
      const userForgottenPasswordDto: UserForgottenPasswordDto = {
        emailAddress: 'nonexistent@example.com',
        locale: 'en',
      };

      mockAuthService.handleForgottenPassword.mockRejectedValue(
        new BadRequestException('User not found'),
      );

      await expect(
        controller.forgetPassword(userForgottenPasswordDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const userResetPasswordDto: UserResetPasswordDto = {
        password: 'newpassword123',
      };

      const mockUser = {
        uuid: 'user-uuid',
        userAuth: { id: 1 },
      } as UserEntity;

      const mockRequest = { user: mockUser };

      mockAuthService.handleResetPassword.mockResolvedValue(undefined);

      await controller.resetPassword(userResetPasswordDto, mockRequest);

      expect(authService.handleResetPassword).toHaveBeenCalledWith(
        userResetPasswordDto.password,
        mockUser,
      );
    });

    it('should handle password reset errors', async () => {
      const userResetPasswordDto: UserResetPasswordDto = {
        password: 'newpassword123',
      };

      const mockUser = {
        uuid: 'user-uuid',
        userAuth: { id: 1 },
      } as UserEntity;

      const mockRequest = { user: mockUser };

      mockAuthService.handleResetPassword.mockRejectedValue(
        new Error('Reset failed'),
      );

      await expect(
        controller.resetPassword(userResetPasswordDto, mockRequest),
      ).rejects.toThrow('Reset failed');
    });
  });

  describe('Authentication Guards', () => {
    it('should protect logout endpoint with AuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', AuthController.prototype.userLogout);
      expect(guards).toBeDefined();
    });

    it('should protect reset password endpoint with JwtResetPasswordGuard', () => {
      const guards = Reflect.getMetadata('__guards__', AuthController.prototype.resetPassword);
      expect(guards).toBeDefined();
    });
  });

  describe('API Documentation', () => {
    it('should have proper Swagger decorators', () => {
      const apiTags = Reflect.getMetadata('swagger/apiUseTags', AuthController);
      expect(apiTags).toContain('Auth');
    });

    it('should document login endpoint response', () => {
      const responses = Reflect.getMetadata(
        'swagger/apiResponse',
        controller.userLogin,
      );
      expect(responses).toBeDefined();
    });

    it('should document register endpoint response', () => {
      const responses = Reflect.getMetadata(
        'swagger/apiResponse',
        controller.userRegister,
      );
      expect(responses).toBeDefined();
    });
  });
});
