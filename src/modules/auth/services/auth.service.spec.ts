import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserService, UserAuthService, UserAuthForgottenPasswordService } from '../../user/services';
import { createMockJwtService, createMockConfigService } from '../../../test-utils';
import { createMockUser, createMockUserAuth } from '../../../test-utils';
import { UserLoginDto, UserForgottenPasswordDto } from '../dtos';
import { UserNotFoundException, UserPasswordNotValidException } from '../../../exceptions';
import { ForgottenTokenHasUsedException, WrongCredentialsProvidedException } from '../exceptions';
import { UtilsService } from '../../../utils/services';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let userService: jest.Mocked<UserService>;
  let userAuthService: jest.Mocked<UserAuthService>;
  let userAuthForgottenPasswordService: jest.Mocked<UserAuthForgottenPasswordService>;

  beforeEach(async () => {
    const mockUserService = {
      getUser: jest.fn(),
    };
    const mockUserAuthService = {
      findUserAuth: jest.fn(),
      updateLastLoggedDate: jest.fn(),
      updatePassword: jest.fn(),
    };
    const mockUserAuthForgottenPasswordService = {
      sendEmailWithToken: jest.fn(),
      createForgottenPassword: jest.fn(),
      changeTokenActiveStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: createMockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: createMockConfigService(),
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: UserAuthService,
          useValue: mockUserAuthService,
        },
        {
          provide: UserAuthForgottenPasswordService,
          useValue: mockUserAuthForgottenPasswordService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    userService = module.get(UserService);
    userAuthService = module.get(UserAuthService);
    userAuthForgottenPasswordService = module.get(UserAuthForgottenPasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createToken', () => {
    it('should create JWT token for user', async () => {
      const user = createMockUser();
      
      const result = await service.createToken(user);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        uuid: user.uuid,
        role: user.userAuth.role,
      });
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.expiresIn).toBe('3600');
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const userLoginDto: UserLoginDto = {
        pinCode: 12345,
        password: 'password123',
      };
      const user = createMockUser();

      userAuthService.findUserAuth.mockResolvedValue(user);
      jest.spyOn(UtilsService, 'validateHash').mockResolvedValue(true);
      userAuthService.updateLastLoggedDate.mockResolvedValue(user);

      const result = await service.validateUser(userLoginDto);

      expect(userAuthService.findUserAuth).toHaveBeenCalledWith({ pinCode: 12345 });
      expect(UtilsService.validateHash).toHaveBeenCalledWith('password123', user.userAuth.password);
      expect(userAuthService.updateLastLoggedDate).toHaveBeenCalledWith(user, true);
      expect(result).toBe(user);
    });

    it('should throw UserNotFoundException when user not found', async () => {
      const userLoginDto: UserLoginDto = {
        pinCode: 99999,
        password: 'password123',
      };

      userAuthService.findUserAuth.mockResolvedValue(null);

      await expect(service.validateUser(userLoginDto)).rejects.toThrow(UserNotFoundException);
    });

    it('should throw UserPasswordNotValidException with invalid password', async () => {
      const userLoginDto: UserLoginDto = {
        pinCode: 12345,
        password: 'wrongpassword',
      };
      const user = createMockUser();

      userAuthService.findUserAuth.mockResolvedValue(user);
      jest.spyOn(UtilsService, 'validateHash').mockResolvedValue(false);
      userAuthService.updateLastLoggedDate.mockResolvedValue(user);

      await expect(service.validateUser(userLoginDto)).rejects.toThrow(UserPasswordNotValidException);
    });
  });

  describe('handleForgottenPassword', () => {
    it('should handle forgotten password request', async () => {
      const forgottenPasswordDto: UserForgottenPasswordDto = {
        emailAddress: 'test@example.com',
        locale: 'en',
      };
      const user = createMockUser();

      userService.getUser.mockResolvedValue(user);
      jwtService.signAsync.mockResolvedValue('forgotten-token');
      userAuthForgottenPasswordService.createForgottenPassword.mockResolvedValue({} as any);
      userAuthForgottenPasswordService.sendEmailWithToken.mockImplementation(() => Promise.resolve());

      await service.handleForgottenPassword(forgottenPasswordDto);

      expect(userService.getUser).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(userAuthForgottenPasswordService.createForgottenPassword).toHaveBeenCalled();
      expect(userAuthForgottenPasswordService.sendEmailWithToken).toHaveBeenCalled();
    });

    it('should throw WrongCredentialsProvidedException when user not found', async () => {
      const forgottenPasswordDto: UserForgottenPasswordDto = {
        emailAddress: 'nonexistent@example.com',
        locale: 'en',
      };

      userService.getUser.mockResolvedValue(null);

      await expect(service.handleForgottenPassword(forgottenPasswordDto)).rejects.toThrow(WrongCredentialsProvidedException);
    });
  });

  describe('handleResetPassword', () => {
    it('should reset password successfully', async () => {
      const password = 'newpassword123';
      const forgottenPasswordEntity = {
        id: 1,
        used: false,
        user: { userAuth: createMockUserAuth() },
      } as any;

      userAuthForgottenPasswordService.changeTokenActiveStatus.mockResolvedValue({} as any);
      userAuthService.updatePassword.mockResolvedValue({} as any);

      await service.handleResetPassword(password, forgottenPasswordEntity);

      expect(userAuthForgottenPasswordService.changeTokenActiveStatus).toHaveBeenCalledWith(forgottenPasswordEntity, true);
      expect(userAuthService.updatePassword).toHaveBeenCalledWith(forgottenPasswordEntity.user.userAuth, password);
    });

    it('should throw ForgottenTokenHasUsedException when token already used', async () => {
      const password = 'newpassword123';
      const forgottenPasswordEntity = {
        id: 1,
        used: true,
        user: { userAuth: createMockUserAuth() },
      } as any;

      await expect(service.handleResetPassword(password, forgottenPasswordEntity)).rejects.toThrow(ForgottenTokenHasUsedException);
    });
  });

  describe('validateForgottenPasswordToken', () => {
    it('should validate forgotten password token', async () => {
      const forgottenPassword = {
        hashedToken: 'hashed-token',
      } as any;
      const token = 'plain-token';

      jest.spyOn(UtilsService, 'validateHash').mockResolvedValue(true);

      await expect(service.validateForgottenPasswordToken(forgottenPassword, token)).resolves.not.toThrow();

      expect(UtilsService.validateHash).toHaveBeenCalledWith(token, 'hashed-token');
    });

    it('should throw WrongCredentialsProvidedException with invalid token', async () => {
      const forgottenPassword = {
        hashedToken: 'hashed-token',
      } as any;
      const token = 'invalid-token';

      jest.spyOn(UtilsService, 'validateHash').mockResolvedValue(false);

      await expect(service.validateForgottenPasswordToken(forgottenPassword, token)).rejects.toThrow(WrongCredentialsProvidedException);
    });
  });

  describe('setAuthUser and getAuthUser', () => {
    it('should set and get auth user from context', () => {
      const user = createMockUser();

      AuthService.setAuthUser(user);
      const retrievedUser = AuthService.getAuthUser();

      expect(retrievedUser).toBe(user);
    });
  });
});
