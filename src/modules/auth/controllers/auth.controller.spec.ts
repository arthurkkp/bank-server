import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services';
import { UserService, UserAuthService } from '../../user/services';
import { createMockUser } from '../../../test-utils';
import { UserLoginDto, UserForgottenPasswordDto, UserResetPasswordDto } from '../dtos';
import { UserRegisterDto } from '../dtos';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let userService: jest.Mocked<UserService>;
  let userAuthService: jest.Mocked<UserAuthService>;

  beforeEach(async () => {
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
    authService = module.get(AuthService);
    userService = module.get(UserService);
    userAuthService = module.get(UserAuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('userLogin', () => {
    it('should login user successfully', async () => {
      const userLoginDto: UserLoginDto = {
        pinCode: 12345,
        password: 'password123',
      };
      const user = createMockUser();
      const token = { accessToken: 'jwt-token', expiresIn: '3600' };
      const userDto = { id: 1, email: 'test@example.com' };

      (user as any).toDto = jest.fn().mockReturnValue(userDto);
      authService.validateUser.mockResolvedValue(user);
      authService.createToken.mockResolvedValue(token as any);

      const result = await controller.userLogin(userLoginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(userLoginDto);
      expect(authService.createToken).toHaveBeenCalledWith(user);
      expect(result.user).toBe(userDto);
      expect(result.token).toBe(token);
    });
  });

  describe('userRegister', () => {
    it('should register user successfully', async () => {
      const userRegisterDto: UserRegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        currency: 'usd-uuid',
      };
      const user = createMockUser();
      const userDto = { id: 1, email: 'john.doe@example.com' };

      (user as any).toDto = jest.fn().mockReturnValue(userDto);
      userService.createUser.mockResolvedValue(user);

      const result = await controller.userRegister(userRegisterDto);

      expect(userService.createUser).toHaveBeenCalledWith(userRegisterDto);
      expect(result).toBe(userDto);
    });
  });

  describe('userLogout', () => {
    it('should logout user successfully', async () => {
      const user = createMockUser();

      userAuthService.updateLastLogoutDate.mockResolvedValue({} as any);

      await controller.userLogout(user);

      expect(userAuthService.updateLastLogoutDate).toHaveBeenCalledWith(user.userAuth);
    });
  });

  describe('forgetPassword', () => {
    it('should handle forgotten password request', async () => {
      const userForgottenPasswordDto: UserForgottenPasswordDto = {
        emailAddress: 'test@example.com',
        locale: 'en',
      };

      authService.handleForgottenPassword.mockResolvedValue(undefined);

      await controller.forgetPassword(userForgottenPasswordDto);

      expect(authService.handleForgottenPassword).toHaveBeenCalledWith(userForgottenPasswordDto);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const userResetPasswordDto: UserResetPasswordDto = {
        password: 'newpassword123',
      };
      const req = {
        user: { id: 1, hashedToken: 'token' },
      };

      authService.handleResetPassword.mockResolvedValue(undefined);

      await controller.resetPassword(userResetPasswordDto, req);

      expect(authService.handleResetPassword).toHaveBeenCalledWith('newpassword123', req.user);
    });
  });
});
