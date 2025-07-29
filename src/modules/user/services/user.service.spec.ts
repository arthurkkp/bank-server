import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from '../repositories';
import { UserAuthService } from './user-auth.service';
import { BillService } from '../../bill/services';
import { createMockRepository, createMockUser } from '../../../test-utils';
import { UserEntity } from '../entities';
import { UserUpdateDto } from '../dtos';
import { UserRegisterDto } from '../../auth/dtos';
import { CreateFailedException } from '../../../exceptions';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let userAuthService: jest.Mocked<UserAuthService>;
  let billService: jest.Mocked<BillService>;

  beforeEach(async () => {
    const mockUserRepository = createMockRepository();
    const mockUserAuthService = {
      createUserAuth: jest.fn(),
    };
    const mockBillService = {
      createAccountBill: jest.fn(),
    };

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
          provide: BillService,
          useValue: mockBillService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    userAuthService = module.get(UserAuthService);
    billService = module.get(BillService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUser', () => {
    it('should return user by email', async () => {
      const email = 'test@example.com';
      const mockUser = createMockUser({ email });
      const mockQueryBuilder = userRepository.createQueryBuilder();

      mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockUser);

      const result = await service.getUser({ email });

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(result).toBe(mockUser);
    });

    it('should return user by uuid', async () => {
      const uuid = 'test-uuid';
      const mockUser = createMockUser({ uuid });
      const mockQueryBuilder = userRepository.createQueryBuilder();

      mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockUser);

      const result = await service.getUser({ uuid });

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(result).toBe(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userRegisterDto: UserRegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        currency: 'usd-uuid',
      };
      const mockUser = createMockUser();

      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      userAuthService.createUserAuth.mockResolvedValue({} as any);
      billService.createAccountBill.mockResolvedValue(undefined);

      const result = await service.createUser(userRegisterDto);

      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(userAuthService.createUserAuth).toHaveBeenCalled();
      expect(billService.createAccountBill).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it('should throw CreateFailedException on save error', async () => {
      const userRegisterDto: UserRegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        currency: 'usd-uuid',
      };
      const mockUser = createMockUser();

      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createUser(userRegisterDto)).rejects.toThrow(CreateFailedException);
    });
  });

  describe('updateUserData', () => {
    it('should update user data successfully', async () => {
      const user = createMockUser();
      const updateDto: UserUpdateDto = {} as any;
      const updatedUser = createMockUser();

      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUserData(user, updateDto);

      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toBe(updatedUser);
    });
  });
});
