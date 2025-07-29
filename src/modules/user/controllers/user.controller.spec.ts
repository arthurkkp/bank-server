import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService, UserConfigService } from '../services';
import { createMockUser } from '../../../test-utils';
import { UserUpdateDto } from '../dtos';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;
  let userConfigService: jest.Mocked<UserConfigService>;

  beforeEach(async () => {
    const mockUserService = {
      getUser: jest.fn(),
      updateUserData: jest.fn(),
    };
    const mockUserConfigService = {
      getUserConfig: jest.fn(),
    };

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
    userService = module.get(UserService);
    userConfigService = module.get(UserConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserData', () => {
    it('should return user data', async () => {
      const user = createMockUser();
      const userDto = { id: 1, email: 'test@example.com' };

      userService.getUser.mockResolvedValue(user);
      (user as any).toDto = jest.fn().mockReturnValue(userDto);

      const result = await controller.getUserData(user);

      expect(userService.getUser).toHaveBeenCalledWith({ uuid: (user as any).uuid });
      expect(result).toBe(userDto);
    });
  });

  describe('setUserData', () => {
    it('should update user data', async () => {
      const user = createMockUser();
      const userUpdateDto: UserUpdateDto = {} as any;
      const updatedUser = createMockUser();
      const userDto = { id: 1, email: 'test@example.com' };

      (updatedUser as any).toDto = jest.fn().mockReturnValue(userDto);
      userService.updateUserData.mockResolvedValue(updatedUser);

      const result = await controller.setUserData(user, userUpdateDto);

      expect(userService.updateUserData).toHaveBeenCalledWith(user, userUpdateDto);
      expect(result).toBe(userDto);
    });
  });

  describe('checkEmail', () => {
    it('should check if email exists', async () => {
      const email = 'test@example.com';
      const user = createMockUser({ email });

      userService.getUser.mockResolvedValue(user);

      const result = await controller.checkEmail(email);

      expect(userService.getUser).toHaveBeenCalledWith({ email: email.toLowerCase() });
      expect(result.exist).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      const email = 'nonexistent@example.com';

      userService.getUser.mockResolvedValue(null);

      const result = await controller.checkEmail(email);

      expect(userService.getUser).toHaveBeenCalledWith({ email: email.toLowerCase() });
      expect(result.exist).toBe(false);
    });
  });
});
