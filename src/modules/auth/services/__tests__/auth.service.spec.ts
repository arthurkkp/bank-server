import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UserService } from '../../../user/services/user.service';
import { UserAuthService } from '../../../user/services/user-auth.service';
// import { MailService } from '../../../mail/services/mail.service';
import { UserEntity } from '../../../user/entities/user.entity';
import { UserLoginDto, UserForgottenPasswordDto } from '../../dtos';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let userAuthService: UserAuthService;
  let jwtService: JwtService;
  let mailService: any;
  let configService: ConfigService;

  const mockUserService = {
    getUser: jest.fn(),
    updateUserData: jest.fn(),
  };

  const mockUserAuthService = {
    updateLastLoggedDate: jest.fn(),
    updatePassword: jest.fn(),
    findUserAuth: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockMailService = {
    sendForgottenPasswordEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUserAuthForgottenPasswordService = {
    createForgottenPassword: jest.fn(),
    sendEmailWithToken: jest.fn(),
    changeTokenActiveStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: UserAuthService,
          useValue: mockUserAuthService,
        },
        {
          provide: 'UserAuthForgottenPasswordService',
          useValue: mockUserAuthForgottenPasswordService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: 'MailService',
          useValue: mockMailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    userAuthService = module.get<UserAuthService>(UserAuthService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get('MailService');
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createToken', () => {
    it('should create JWT token for user', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@example.com',
        userAuth: { id: 1, role: 'USER' },
      } as unknown as UserEntity;

      const mockToken = 'jwt-token';
      mockJwtService.signAsync.mockResolvedValue(mockToken);
      mockConfigService.get.mockReturnValue('3600');

      const result = await service.createToken(mockUser);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        uuid: mockUser.uuid,
        role: mockUser.userAuth.role,
      });
      expect(result).toEqual({
        expiresIn: '3600',
        accessToken: mockToken,
      });
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const userLoginDto = {
        pinCode: 12345,
        password: 'password123',
      } as unknown as UserLoginDto;

      const mockUser = {
        uuid: 'user-uuid',
        userAuth: {
          password: 'hashedPassword',
        },
      } as unknown as UserEntity;

      mockUserAuthService.findUserAuth.mockResolvedValue(mockUser);
      mockUserAuthService.updateLastLoggedDate.mockResolvedValue(mockUser);
      jest.spyOn(require('utils/services').UtilsService, 'validateHash').mockResolvedValue(true);

      const result = await service.validateUser(userLoginDto);

      expect(userAuthService.findUserAuth).toHaveBeenCalledWith({
        pinCode: userLoginDto.pinCode,
      });
      expect(userAuthService.updateLastLoggedDate).toHaveBeenCalledWith(mockUser, true);
      expect(result).toBe(mockUser);
    });

    it('should throw UserNotFoundException for invalid pinCode', async () => {
      const userLoginDto = {
        pinCode: 99999,
        password: 'password123',
      } as unknown as UserLoginDto;

      mockUserAuthService.findUserAuth.mockResolvedValue(null);

      await expect(service.validateUser(userLoginDto)).rejects.toThrow(
        'error.user_not_found',
      );
    });

    it('should throw UserPasswordNotValidException for invalid password', async () => {
      const userLoginDto = {
        pinCode: 12345,
        password: 'wrongpassword',
      } as unknown as UserLoginDto;

      const mockUser = {
        uuid: 'user-uuid',
        userAuth: {
          password: 'hashedPassword',
        },
      } as unknown as UserEntity;

      mockUserAuthService.findUserAuth.mockResolvedValue(mockUser);
      mockUserAuthService.updateLastLoggedDate.mockResolvedValue(mockUser);
      jest.spyOn(require('utils/services').UtilsService, 'validateHash').mockResolvedValue(false);

      await expect(service.validateUser(userLoginDto)).rejects.toThrow(
        'error.user_password_not_valid',
      );
    });
  });

  describe('handleForgottenPassword', () => {
    it('should handle forgotten password request', async () => {
      const forgottenPasswordDto = {
        emailAddress: 'test@example.com',
        locale: 'en',
      } as unknown as UserForgottenPasswordDto;

      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@example.com',
      } as unknown as UserEntity;

      const mockToken = 'reset-token';

      mockUserService.getUser.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue(mockToken);
      mockConfigService.get
        .mockReturnValueOnce('secret')
        .mockReturnValueOnce('1800');

      await service.handleForgottenPassword(forgottenPasswordDto);

      expect(userService.getUser).toHaveBeenCalledWith({
        email: forgottenPasswordDto.emailAddress,
      });
      expect(mockUserAuthForgottenPasswordService.createForgottenPassword).toHaveBeenCalled();
      expect(mockUserAuthForgottenPasswordService.sendEmailWithToken).toHaveBeenCalledWith(
        mockUser,
        expect.stringContaining('reset'),
        forgottenPasswordDto.locale,
      );
    });

    it('should throw WrongCredentialsProvidedException for non-existent user', async () => {
      const forgottenPasswordDto = {
        emailAddress: 'nonexistent@example.com',
        locale: 'en',
      } as unknown as UserForgottenPasswordDto;

      mockUserService.getUser.mockResolvedValue(null);

      await expect(
        service.handleForgottenPassword(forgottenPasswordDto),
      ).rejects.toThrow('Wrong credentials provided');
    });
  });

  describe('handleResetPassword', () => {
    it('should reset password successfully', async () => {
      const newPassword = 'newpassword123';
      const mockUserAuthForgottenPasswordEntity = {
        used: false,
        user: {
          userAuth: { id: 1 },
        },
      } as any;

      await service.handleResetPassword(newPassword, mockUserAuthForgottenPasswordEntity);

      expect(mockUserAuthForgottenPasswordService.changeTokenActiveStatus).toHaveBeenCalledWith(
        mockUserAuthForgottenPasswordEntity,
        true,
      );
      expect(userAuthService.updatePassword).toHaveBeenCalledWith(
        mockUserAuthForgottenPasswordEntity.user.userAuth,
        newPassword,
      );
    });

    it('should throw ForgottenTokenHasUsedException for used token', async () => {
      const newPassword = 'newpassword123';
      const mockUserAuthForgottenPasswordEntity = {
        used: true,
        user: {
          userAuth: { id: 1 },
        },
      } as any;

      await expect(
        service.handleResetPassword(newPassword, mockUserAuthForgottenPasswordEntity),
      ).rejects.toThrow('The given token has used');
    });
  });

  describe('validateForgottenPasswordToken', () => {
    it('should validate forgotten password token', async () => {
      const token = 'valid-token';
      const mockForgottenPassword = {
        hashedToken: 'hashed-token',
      } as any;

      jest.spyOn(require('utils/services').UtilsService, 'validateHash').mockResolvedValue(true);

      await service.validateForgottenPasswordToken(mockForgottenPassword, token);

      expect(require('utils/services').UtilsService.validateHash).toHaveBeenCalledWith(
        token,
        mockForgottenPassword.hashedToken,
      );
    });

    it('should throw WrongCredentialsProvidedException for invalid token', async () => {
      const token = 'invalid-token';
      const mockForgottenPassword = {
        hashedToken: 'hashed-token',
      } as any;

      jest.spyOn(require('utils/services').UtilsService, 'validateHash').mockResolvedValue(false);

      await expect(
        service.validateForgottenPasswordToken(mockForgottenPassword, token),
      ).rejects.toThrow('Wrong credentials provided');
    });
  });
});
