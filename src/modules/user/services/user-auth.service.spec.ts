import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthService } from './user-auth.service';
import { UserAuthRepository } from '../repositories';
import { UserRepository } from '../repositories';
import { UserConfigService } from './user-config.service';
import { UserService } from './user.service';
import { createMockRepository, createMockUser, createMockUserAuth } from '../../../test-utils';
import { UserAuthEntity } from '../entities';
import { UtilsService } from '../../../utils/services';

describe('UserAuthService', () => {
  let service: UserAuthService;
  let userAuthRepository: jest.Mocked<UserAuthRepository>;

  beforeEach(async () => {
    const mockUserAuthRepository = createMockRepository();
    const mockUserRepository = createMockRepository();
    const mockUserConfigService = {
      createUserConfig: jest.fn(),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findUserAuth', () => {
    it('should find user by pin code', async () => {
      const pinCode = 12345;
      const user = createMockUser();
      const mockQueryBuilder = userAuthRepository.createQueryBuilder();

      mockQueryBuilder.getOne = jest.fn().mockResolvedValue(user);

      const result = await service.findUserAuth({ pinCode });

      expect(userAuthRepository.createQueryBuilder).toHaveBeenCalledWith('userAuth');
      expect(result).toBe(user);
    });
  });

  describe('createUserAuth', () => {
    it('should create user auth successfully', async () => {
      const user = createMockUser();
      const password = 'password123';
      const mockUserAuth = createMockUserAuth();

      (UtilsService.generateHash as jest.Mock) = jest.fn().mockResolvedValue('hashed-password');
      jest.spyOn(UtilsService, 'generateRandomInteger').mockReturnValue(12345);
      userAuthRepository.create.mockReturnValue(mockUserAuth);
      userAuthRepository.save.mockResolvedValue(mockUserAuth);

      const result = await service.createUserAuth(user);

      expect(UtilsService.generateHash).toHaveBeenCalledWith(password);
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

      userAuthRepository.save.mockResolvedValue(updatedUser.userAuth);

      const result = await service.updateLastLoggedDate(user, isPasswordValid);

      expect(userAuthRepository.save).toHaveBeenCalled();
      expect(result).toBe(user);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const userAuth = createMockUserAuth();
      const newPassword = 'newpassword123';

      (UtilsService.generateHash as jest.Mock) = jest.fn().mockResolvedValue('new-hashed-password');
      userAuthRepository.save.mockResolvedValue(userAuth);

      await service.updatePassword(userAuth, newPassword);

      expect(UtilsService.generateHash).toHaveBeenCalledWith(newPassword);
      expect(userAuthRepository.save).toHaveBeenCalled();
    });
  });
});
