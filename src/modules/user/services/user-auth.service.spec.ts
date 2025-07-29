import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthService } from './user-auth.service';
import { UserAuthRepository } from '../repositories';
import { UserRepository } from '../repositories';
import { UserConfigService } from './user-config.service';
import { UserService } from './user.service';
import { createMockRepository, createMockUser, createMockUserAuth } from '../../../test-utils';
import { UserAuthEntity } from '../entities';
import { UtilsService } from '../../../utils/services';

jest.mock('../../../utils/services', () => ({
  UtilsService: {
    generateHash: jest.fn(),
    validateHash: jest.fn(),
    generateRandomInteger: jest.fn(),
    generateRandomString: jest.fn(),
  },
}));

describe('UserAuthService', () => {
  let service: UserAuthService;
  let userAuthRepository: jest.Mocked<UserAuthRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const mockUserAuthRepository = createMockRepository();
    const mockUserRepository = createMockRepository();
    const mockUserConfigService = {
      createUserConfig: jest.fn(),
      updateLastPresentLoggedDate: jest.fn().mockResolvedValue({}),
    };
    const mockUserService = {
      getUser: jest.fn(),
      createUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAuthService,
        {
          provide: UserAuthRepository,
          useValue: mockUserAuthRepository,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserConfigService,
          useValue: mockUserConfigService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<UserAuthService>(UserAuthService);
    userAuthRepository = module.get(UserAuthRepository);
    userRepository = module.get(UserRepository);
    userService = module.get(UserService);

    (UtilsService.generateHash as jest.Mock).mockResolvedValue('hashed-password');
    (UtilsService.generateRandomInteger as jest.Mock).mockReturnValue(12345);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findUserAuth', () => {
    it('should find user by pin code', async () => {
      const pinCode = 12345;
      const user = createMockUser();
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };

      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findUserAuth({ pinCode });

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(result).toBe(user);
    });
  });

  describe('createUserAuth', () => {
    it('should create user auth successfully', async () => {
      const user = createMockUser();
      const mockUserAuth = createMockUserAuth();

      jest.spyOn(service, 'findUserAuth').mockResolvedValue(null);
      userAuthRepository.create.mockReturnValue(mockUserAuth);
      userAuthRepository.save.mockResolvedValue(mockUserAuth);

      const result = await service.createUserAuth(user);

      expect(UtilsService.generateRandomInteger).toHaveBeenCalled();
      expect(userAuthRepository.create).toHaveBeenCalled();
      expect(userAuthRepository.save).toHaveBeenCalledWith(mockUserAuth);
      expect(result).toBe(mockUserAuth);
    });
  });

  describe('updateLastLoggedDate', () => {
    it('should update last logged date for valid password', async () => {
      const user = createMockUser();
      const isPasswordValid = true;
      const updatedUser = createMockUser();
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      userAuthRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      userService.getUser.mockResolvedValue(updatedUser);

      const result = await service.updateLastLoggedDate(user, isPasswordValid);

      expect(userAuthRepository.createQueryBuilder).toHaveBeenCalledWith('userAuth');
      expect(result).toBe(updatedUser);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const userAuth = createMockUserAuth();
      const newPassword = 'newpassword123';
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      userAuthRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.updatePassword(userAuth, newPassword);

      expect(userAuthRepository.createQueryBuilder).toHaveBeenCalledWith('userAuth');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ password: newPassword });
      expect(result.affected).toBe(1);
    });
  });
});
