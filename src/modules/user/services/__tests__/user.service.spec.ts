import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserEntity } from '../../entities/user.entity';
import { UserRepository } from '../../repositories/user.repository';
import { UserAuthService } from '../user-auth.service';
import { UserConfigService } from '../user-config.service';
import { BillService } from '../../../bill/services/bill.service';
import { CurrencyService } from '../../../currency/services/currency.service';
import { UserUpdateDto } from '../../dtos';
import { UserRegisterDto } from '../../../auth/dtos';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('typeorm-transactional-cls-hooked', () => ({
  Transactional: () => (target: any, propertyName: string, descriptor: PropertyDescriptor) => descriptor,
  initializeTransactionalContext: jest.fn(),
}));

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;
  let userAuthService: UserAuthService;
  let userConfigService: UserConfigService;
  let billService: BillService;
  let currencyService: CurrencyService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getCount: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    update: jest.fn(),
  };

  const mockUserAuthService = {
    createUserAuth: jest.fn(),
  };

  const mockUserConfigService = {
    createUserConfig: jest.fn(),
    updateMainCurrency: jest.fn(),
  };

  const mockBillService = {
    createAccountBill: jest.fn(),
  };

  const mockCurrencyService = {
    findCurrency: jest.fn().mockResolvedValue({ uuid: 'currency-uuid', code: 'USD' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserAuthService,
          useValue: mockUserAuthService,
        },
        {
          provide: UserConfigService,
          useValue: mockUserConfigService,
        },
        {
          provide: BillService,
          useValue: mockBillService,
        },
        {
          provide: CurrencyService,
          useValue: mockCurrencyService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    userAuthService = module.get<UserAuthService>(UserAuthService);
    userConfigService = module.get<UserConfigService>(UserConfigService);
    billService = module.get<BillService>(BillService);
    currencyService = module.get<CurrencyService>(CurrencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockQueryBuilder.getOne.mockReset();
    mockQueryBuilder.getCount.mockReset();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userRegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        currency: 'USD',
      };

      const hashedPassword = 'hashedPassword';
      const mockUserAuth = { id: 1, password: hashedPassword };
      const mockUserConfig = { id: 1, currency: 'USD' };
      const mockUser = {
        uuid: 'user-uuid',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        userAuth: mockUserAuth,
        userConfig: mockUserConfig,
      };

      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserAuthService.createUserAuth.mockResolvedValue(mockUserAuth);
      mockUserConfigService.createUserConfig.mockResolvedValue(mockUserConfig);
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      const result = await service.createUser(userRegisterDto);

      expect(userRepository.create).toHaveBeenCalledWith(userRegisterDto);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(userAuthService.createUserAuth).toHaveBeenCalled();
      expect(userConfigService.createUserConfig).toHaveBeenCalled();
      expect(billService.createAccountBill).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it('should throw BadRequestException if email already exists', async () => {
      const userRegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        currency: 'USD',
      };

      const existingUser = { id: 1, email: 'existing@example.com' };
      mockUserRepository.create.mockReturnValue(existingUser);
      mockUserRepository.save.mockRejectedValue(new Error('Email already exists'));

      await expect(service.createUser(userRegisterDto)).rejects.toThrow();
      expect(userRepository.create).toHaveBeenCalledWith(userRegisterDto);
    });

    it('should handle password hashing errors', async () => {
      const userRegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        currency: 'USD',
      };

      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue(new Error('Hashing failed'));

      await expect(service.createUser(userRegisterDto)).rejects.toThrow();
    });
  });

  describe('getUser', () => {
    it('should get user by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      const result = await service.getUser({ email });

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith('user.email = :email', { email });
      expect(result).toBe(mockUser);
    });

    it('should get user by uuid', async () => {
      const uuid = 'user-uuid';
      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      const result = await service.getUser({ uuid });

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';

      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.getUser({ email });

      expect(result).toBeNull();
    });
  });

  describe('getUsersCount', () => {
    it('should return total users count', async () => {
      const expectedCount = 42;
      mockQueryBuilder.getCount.mockResolvedValue(expectedCount);

      const result = await service.getUsersCount();

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.getCount).toHaveBeenCalled();
      expect(result).toBe(expectedCount);
    });

    it('should handle repository errors', async () => {
      mockQueryBuilder.getCount.mockRejectedValue(new Error('Database error'));

      await expect(service.getUsersCount()).rejects.toThrow('Database error');
    });
  });

  describe('updateUserData', () => {
    it('should update user data successfully', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        email: 'old@example.com',
        firstName: 'John',
        lastName: 'Doe',
      } as unknown as UserEntity;

      const userUpdateDto: UserUpdateDto = {
        lastName: 'Smith',
        email: 'new@example.com',
      };

      const updatedUser = {
        ...mockUser,
        ...userUpdateDto,
        email: userUpdateDto.email.toLowerCase(),
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(null).mockResolvedValueOnce(updatedUser);
      mockUserRepository.update.mockResolvedValue(undefined);

      const result = await service.updateUserData(mockUser, userUpdateDto);

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith('user.email = :email', { email: userUpdateDto.email });
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, { email: userUpdateDto.email });
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, { lastName: userUpdateDto.lastName });
      expect(result).toBe(updatedUser);
    });

    it('should throw BadRequestException if new email already exists', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        email: 'old@example.com',
      } as unknown as UserEntity;

      const userUpdateDto: UserUpdateDto = {
        email: 'existing@example.com',
      };

      const existingUser = {
        uuid: 'different-uuid',
        email: 'existing@example.com',
      };

      mockQueryBuilder.getOne.mockResolvedValue(existingUser);

      await expect(
        service.updateUserData(mockUser, userUpdateDto),
      ).rejects.toThrow();
    });

    it('should allow updating to same email', async () => {
      const mockUser = {
        id: 1,
        uuid: 'user-uuid',
        email: 'same@example.com',
        firstName: 'John',
      } as unknown as UserEntity;

      const userUpdateDto: UserUpdateDto = {
        email: 'same@example.com',
        lastName: 'Jane',
      };

      const updatedUser = {
        ...mockUser,
        lastName: 'Jane',
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(null).mockResolvedValueOnce(updatedUser);
      mockUserRepository.update.mockResolvedValue(undefined);

      const result = await service.updateUserData(mockUser, userUpdateDto);

      expect(result).toBe(updatedUser);
    });

    it('should validate currency if provided', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@example.com',
        userConfig: { currency: 'USD' },
      } as unknown as UserEntity;

      const userUpdateDto: UserUpdateDto = {
        currency: 'EUR',
      };

      mockQueryBuilder.getOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);
      mockUserConfigService.updateMainCurrency.mockResolvedValue(undefined);
      
      await service.updateUserData(mockUser, userUpdateDto);

      expect(currencyService.findCurrency).toHaveBeenCalledWith({ uuid: userUpdateDto.currency });
      expect(userConfigService.updateMainCurrency).toHaveBeenCalledWith(
        mockUser.userConfig,
        { uuid: 'currency-uuid', code: 'USD' }
      );
    });
  });
});
