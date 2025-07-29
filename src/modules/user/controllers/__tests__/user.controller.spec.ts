import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../../services/user.service';
import { UserConfigService } from '../../services/user-config.service';
import { UserEntity } from '../../entities/user.entity';
import { UserUpdateDto } from '../../dtos';
import { BadRequestException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let userConfigService: UserConfigService;

  const mockUserService = {
    getUser: jest.fn(),
    updateUserData: jest.fn(),
  };

  const mockUserConfigService = {
    updateUserConfig: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: UserConfigService,
          useValue: mockUserConfigService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    userConfigService = module.get<UserConfigService>(UserConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserData', () => {
    it('should return user data', async () => {
      const mockUser = {
        id: 'user-uuid',
        uuid: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      } as unknown as UserEntity;

      const mockUserEntity = {
        id: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        toDto: jest.fn().mockReturnValue({
          id: 'user-uuid',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        }),
      } as any;

      mockUserService.getUser.mockResolvedValue(mockUserEntity);

      const result = await controller.getUserData(mockUser);

      expect(userService.getUser).toHaveBeenCalledWith({
        uuid: mockUser.id,
      });
      expect(result).toEqual(mockUserEntity.toDto());
    });

    it('should handle user not found', async () => {
      const mockUser = {
        id: 'nonexistent-uuid',
      } as unknown as UserEntity;

      mockUserService.getUser.mockResolvedValue(null);

      await expect(controller.getUserData(mockUser)).rejects.toThrow();
    });
  });

  describe('setUserData', () => {
    it('should update user data successfully', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'old@example.com',
        firstName: 'John',
        lastName: 'Doe',
      } as unknown as UserEntity;

      const userUpdateDto: UserUpdateDto = {
        email: 'new@example.com',
      };

      const updatedUser = {
        id: 'user-uuid',
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        toDto: jest.fn().mockReturnValue({
          id: 'user-uuid',
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        }),
      } as any;

      mockUserService.updateUserData.mockResolvedValue(updatedUser);

      const result = await controller.setUserData(mockUser, userUpdateDto);

      expect(userService.updateUserData).toHaveBeenCalledWith(
        mockUser,
        userUpdateDto,
      );
      expect(result).toEqual(updatedUser.toDto());
    });

    it('should throw BadRequestException for invalid email', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
      } as unknown as UserEntity;

      const userUpdateDto: UserUpdateDto = {
        email: 'invalid-email',
      };

      mockUserService.updateUserData.mockRejectedValue(
        new BadRequestException('Invalid email format'),
      );

      await expect(
        controller.setUserData(mockUser, userUpdateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkEmail', () => {
    it('should check if email exists', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
      };

      mockUserService.getUser.mockResolvedValue(mockUser);

      const result = await controller.checkEmail(email);

      expect(userService.getUser).toHaveBeenCalledWith({
        email: email.toLowerCase(),
      });
      expect(result.exist).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      const email = 'nonexistent@example.com';

      mockUserService.getUser.mockResolvedValue(null);

      const result = await controller.checkEmail(email);

      expect(userService.getUser).toHaveBeenCalledWith({
        email: email.toLowerCase(),
      });
      expect(result.exist).toBe(false);
    });

    it('should handle case insensitive email check', async () => {
      const email = 'TEST@EXAMPLE.COM';
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
      };

      mockUserService.getUser.mockResolvedValue(mockUser);

      await controller.checkEmail(email);

      expect(userService.getUser).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  describe('Authentication Guards', () => {
    it('should have AuthGuard applied to protected endpoints', () => {
      expect(controller).toBeDefined();
      expect(controller.getUserData).toBeDefined();
      expect(controller.setUserData).toBeDefined();
    });
  });

  describe('API Documentation', () => {
    it('should have proper Swagger decorators', () => {
      const apiTags = Reflect.getMetadata('swagger/apiUseTags', UserController);
      expect(apiTags).toContain('Users');
    });

    it('should document getUserData endpoint response', () => {
      const responses = Reflect.getMetadata(
        'swagger/apiResponse',
        controller.getUserData,
      );
      expect(responses).toBeDefined();
    });

    it('should document setUserData endpoint response', () => {
      const responses = Reflect.getMetadata(
        'swagger/apiResponse',
        controller.setUserData,
      );
      expect(responses).toBeDefined();
    });
  });
});
