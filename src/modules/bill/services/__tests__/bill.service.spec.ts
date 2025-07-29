import { Test, TestingModule } from '@nestjs/testing';
import { BillService } from '../bill.service';
import { BillRepository } from '../../repositories/bill.repository';
import { TransactionRepository } from '../../../transaction/repositories/transaction.repository';
import { UserEntity } from '../../../user/entities/user.entity';
import { CreateBillDto } from '../../dtos';
import { BadRequestException } from '@nestjs/common';
import { CurrencyService } from '../../../currency/services/currency.service';

describe('BillService', () => {
  let service: BillService;
  let billRepository: BillRepository;
  let transactionRepository: TransactionRepository;
  let currencyService: CurrencyService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    setParameter: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockBillRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockTransactionRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockCurrencyService = {
    findCurrency: jest.fn().mockResolvedValue({
      id: 1,
      uuid: 'currency-uuid',
      code: 'USD',
      name: 'US Dollar',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillService,
        {
          provide: BillRepository,
          useValue: mockBillRepository,
        },
        {
          provide: TransactionRepository,
          useValue: mockTransactionRepository,
        },
        {
          provide: CurrencyService,
          useValue: mockCurrencyService,
        },
      ],
    }).compile();

    service = module.get<BillService>(BillService);
    billRepository = module.get<BillRepository>(BillRepository);
    transactionRepository = module.get<TransactionRepository>(TransactionRepository);
    currencyService = module.get<CurrencyService>(CurrencyService);

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBills', () => {
    it('should get bills for user with pagination', async () => {
      const mockUser = { id: 1, uuid: 'user-uuid' } as UserEntity;
      const mockBillDtos = [
        { id: 1, title: 'Bill 1', amountMoney: 100 },
        { id: 2, title: 'Bill 2', amountMoney: 200 },
      ];
      const mockBills = {
        toDtos: jest.fn().mockReturnValue(mockBillDtos),
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockBills, 2]);

      const result = await service.getBills(mockUser, { skip: 0, take: 10 } as any);

      expect(billRepository.createQueryBuilder).toHaveBeenCalledWith('bills');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'bills.currency',
        'currency',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('bills.user = :user', {
        user: mockUser.id,
      });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockBills.toDtos).toHaveBeenCalled();
      expect(result.data).toEqual(mockBillDtos);
    });

    it('should handle different page numbers', async () => {
      const mockUser = { id: 1, uuid: 'user-uuid' } as UserEntity;
      const mockBills = {
        toDtos: jest.fn().mockReturnValue([]),
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockBills, 0]);

      await service.getBills(mockUser, { skip: 15, take: 5 } as any);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(15);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('getBill', () => {
    it('should get single bill by id', async () => {
      const mockUser = { id: 1, uuid: 'user-uuid' } as unknown as UserEntity;
      const mockBillDto = {
        id: 1,
        title: 'Test Bill',
        amountMoney: 100,
      };
      const mockBill = {
        id: 1,
        title: 'Test Bill',
        amountMoney: 100,
        user: { uuid: 'user-uuid' },
        toDto: jest.fn().mockReturnValue(mockBillDto),
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockBill);

      const result = await service.getBill(mockUser);

      expect(billRepository.createQueryBuilder).toHaveBeenCalledWith('bill');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'bill.currency',
        'currency',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('bill.user = :user', {
        user: mockUser.id,
      });
      expect(mockBill.toDto).toHaveBeenCalled();
      expect(result).toBe(mockBillDto);
    });

    it('should return null if bill not found', async () => {
      const mockUser = { id: 1, uuid: 'user-uuid' } as unknown as UserEntity;

      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.getBill(mockUser)).rejects.toThrow();
    });
  });

  describe('getTotalAccountBalance', () => {
    it('should calculate total account balance for user', async () => {
      const mockUser = { id: 1, uuid: 'user-uuid' } as UserEntity;
      const mockResult = [{ revenues: '1500', expenses: '500', currencyName: 'USD' }];

      mockQueryBuilder.execute.mockResolvedValue(mockResult);

      const result = await service.getTotalAccountBalance(mockUser);

      expect(transactionRepository.createQueryBuilder).toHaveBeenCalledWith('transactions');
      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith('userId', mockUser.id);
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(result.revenues).toBe('1500');
      expect(result.expenses).toBe('500');
      expect(result.currencyName).toBe('USD');
    });

    it('should return 0 if no bills found', async () => {
      const mockUser = { id: 1, uuid: 'user-uuid' } as UserEntity;
      const mockResult = [{ revenues: '0', expenses: '0', currencyName: 'USD' }];

      mockQueryBuilder.execute.mockResolvedValue(mockResult);

      const result = await service.getTotalAccountBalance(mockUser);

      expect(result.revenues).toBe('0');
      expect(result.expenses).toBe('0');
    });
  });

  describe('getTotalAmountMoney', () => {
    it('should calculate total amount money for user', async () => {
      const mockUser = { id: 1, uuid: 'user-uuid' } as UserEntity;
      const mockResult = [{ amountMoney: '2500.5', currencyName: 'USD' }];

      mockQueryBuilder.execute.mockResolvedValue(mockResult);

      const result = await service.getTotalAmountMoney(mockUser);

      expect(transactionRepository.createQueryBuilder).toHaveBeenCalledWith('transactions');
      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith('userId', mockUser.id);
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(result.amountMoney).toBe('2500.5');
      expect(result.currencyName).toBe('USD');
    });
  });

  describe('createAccountBill', () => {
    it('should create account bill for new user', async () => {
      const mockUser = {
        id: 1,
        uuid: 'user-uuid',
        firstName: 'John',
        lastName: 'Doe',
      } as unknown as UserEntity;

      const mockCreatedUser = {
        user: mockUser,
        currency: 'currency-uuid',
        title: 'Account Bill',
        amountMoney: 25000,
        dateOfPayment: expect.any(Date),
      };

      const mockBill = {
        id: 1,
        title: 'Account Bill',
        amountMoney: 25000,
        user: mockUser,
      };

      const mockEmptyBills = {
        toDtos: jest.fn().mockReturnValue([]),
      };

      mockBillRepository.create.mockReturnValue(mockBill);
      mockBillRepository.save.mockResolvedValue(mockBill);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockEmptyBills, 0]);

      const result = await service.createAccountBill(mockCreatedUser);

      expect(billRepository.create).toHaveBeenCalled();
      expect(billRepository.save).toHaveBeenCalledWith(mockBill);
      expect(result).toBe(mockBill);
    });

    it('should generate unique account bill number', async () => {
      const mockUser = {
        id: 2,
        uuid: 'user-uuid',
        firstName: 'John',
        lastName: 'Doe',
      } as unknown as UserEntity;

      const mockCreatedUser = {
        user: mockUser,
        currency: 'currency-uuid',
        title: 'Account Bill',
        amountMoney: 25000,
        dateOfPayment: expect.any(Date),
      };

      const mockEmptyBills = {
        toDtos: jest.fn().mockReturnValue([]),
      };

      mockBillRepository.create.mockReturnValue({});
      mockBillRepository.save.mockResolvedValue({});
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockEmptyBills, 0]);

      await service.createAccountBill(mockCreatedUser);

      const createCall = mockBillRepository.create.mock.calls[0][0];
      expect(createCall.accountBillNumber).toMatch(/^\d{25,26}$/);
    });
  });

  describe('searchBill', () => {
    it('should search bills by account number', async () => {
      const accountBillNumber = '12345678901234567890';
      const pageOptionsDto = { skip: 0, take: 10 };

      const mockBillDto = {
        id: 1,
        accountBillNumber: '12345678901234567890',
        title: 'Found Bill',
      };
      const mockBills = {
        toDtos: jest.fn().mockReturnValue([mockBillDto]),
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockBills, 1]);

      const result = await service.searchBill(accountBillNumber, pageOptionsDto as any);

      expect(billRepository.createQueryBuilder).toHaveBeenCalledWith('bills');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'bills.currency',
        'currency',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'bills.accountBillNumber LIKE :accountBillNumber',
        { accountBillNumber: `${accountBillNumber}%` },
      );
      expect(mockBills.toDtos).toHaveBeenCalled();
      expect(result.data).toEqual([mockBillDto]);
    });

    it('should return empty array if bill not found', async () => {
      const accountBillNumber = '99999999999999999999';
      const pageOptionsDto = { skip: 0, take: 10 };

      const mockBills = {
        toDtos: jest.fn().mockReturnValue([]),
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockBills, 0]);

      const result = await service.searchBill(accountBillNumber, pageOptionsDto as any);

      expect(mockBills.toDtos).toHaveBeenCalled();
      expect(result.data).toEqual([]);
    });
  });

  describe('findBill', () => {
    it('should find bill by uuid for user', async () => {
      const mockUser = { id: 1 } as UserEntity;
      const uuid = 'bill-uuid-123';
      const mockBill = {
        id: 1,
        uuid,
        user: mockUser,
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockBill);

      const result = await service.findBill(uuid, mockUser);

      expect(billRepository.createQueryBuilder).toHaveBeenCalledWith('bill');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('bill.uuid = :uuid', {
        uuid,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('bill.user = :user', {
        user: mockUser.id,
      });
      expect(result).toBe(mockBill);
    });
  });

  describe('createBill', () => {
    it('should create new bill for user', async () => {
      const mockUser = { 
        id: 3,
        uuid: 'user-uuid',
      } as unknown as UserEntity;

      const mockCreatedUser = {
        user: mockUser,
        currency: 'currency-uuid',
        title: 'Account Bill',
        amountMoney: 25000,
        dateOfPayment: expect.any(Date),
      };

      const mockBill = {
        id: 1,
        title: 'Account Bill',
        amountMoney: 25000,
        user: mockUser,
        dateOfPayment: expect.any(Date),
      };

      const mockEmptyBills = {
        toDtos: jest.fn().mockReturnValue([]),
      };

      mockBillRepository.create.mockReturnValue(mockBill);
      mockBillRepository.save.mockResolvedValue(mockBill);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockEmptyBills, 0]);

      const result = await service.createAccountBill(mockCreatedUser);

      expect(billRepository.create).toHaveBeenCalled();
      expect(billRepository.save).toHaveBeenCalledWith(mockBill);
      expect(result).toBe(mockBill);
    });

    it('should handle currency service errors', async () => {
      const mockUser = { 
        id: 4,
        uuid: 'user-uuid',
        userConfig: { currency: 'INVALID' }
      } as unknown as UserEntity;

      mockCurrencyService.findCurrency.mockResolvedValue(null);

      await expect(
        service.createAccountBill(mockUser),
      ).rejects.toThrow();
    });
  });
});
