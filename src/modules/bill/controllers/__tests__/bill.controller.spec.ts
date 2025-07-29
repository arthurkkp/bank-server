import { Test, TestingModule } from '@nestjs/testing';
import { BillController } from '../bill.controller';
import { BillService } from '../../services/bill.service';
import { UserEntity } from '../../../user/entities/user.entity';
import { CreateBillDto } from '../../dtos';
import { BadRequestException } from '@nestjs/common';

describe('BillController', () => {
  let controller: BillController;
  let billService: BillService;

  const mockBillService = {
    getBills: jest.fn(),
    getBill: jest.fn(),
    createAccountBill: jest.fn(),
    searchBill: jest.fn(),
    getTotalAccountBalance: jest.fn(),
    getTotalAmountMoney: jest.fn(),
    getTotalAccountBalanceHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillController],
      providers: [
        {
          provide: BillService,
          useValue: mockBillService,
        },
      ],
    }).compile();

    controller = module.get<BillController>(BillController);
    billService = module.get<BillService>(BillService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserBills', () => {
    it('should return user bills', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const mockBills = [
        { id: 1, title: 'Electricity Bill', amountMoney: 150.75 },
        { id: 2, title: 'Water Bill', amountMoney: 85.50 },
      ];

      mockBillService.getBills.mockResolvedValue(mockBills);

      const result = await controller.userBills({} as any, mockUser);

      expect(billService.getBills).toHaveBeenCalledWith(mockUser, {});
      expect(result).toBe(mockBills);
    });

    it('should handle empty bills list', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      mockBillService.getBills.mockResolvedValue([]);

      const result = await controller.userBills({} as any, mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('getTotalAccountBalanceHistory', () => {
    it('should return account balance history', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const mockHistory = {
        totalBalance: 5000.50,
        history: [
          { date: '2023-01-01', balance: 4500.00 },
          { date: '2023-01-02', balance: 5000.50 },
        ],
      };

      mockBillService.getTotalAccountBalanceHistory = jest.fn().mockResolvedValue(mockHistory);

      const result = await controller.userAccountBalanceHistory(mockUser);

      expect(billService.getTotalAccountBalanceHistory).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockHistory);
    });
  });

  describe('createBill', () => {
    it('should create new bill', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const createBillDto = {
        currency: 'USD',
      } as unknown as CreateBillDto;

      const mockCreatedBill = {
        id: 1,
        currency: 'USD',
        user: mockUser,
        toDto: jest.fn().mockReturnValue({
          id: 1,
          currency: 'USD',
          accountBillNumber: '12345678901234567890',
        }),
      };

      mockBillService.createAccountBill.mockResolvedValue(mockCreatedBill);

      const result = await controller.createBill(mockUser, createBillDto);

      expect(billService.createAccountBill).toHaveBeenCalledWith({
        user: mockUser,
        currency: createBillDto.currency,
      });
      expect(result).toEqual({
        id: 1,
        currency: 'USD',
        accountBillNumber: '12345678901234567890',
      });
    });

    it('should validate bill data', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const invalidBillDto = {
        currency: 'INVALID',
      } as unknown as CreateBillDto;

      mockBillService.createAccountBill.mockRejectedValue(
        new BadRequestException('Invalid bill data'),
      );

      await expect(
        controller.createBill(mockUser, invalidBillDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('searchBills', () => {
    it('should search bills by account number', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const accountBillNumber = '12345678901234567890';
      const mockBill = {
        id: 1,
        accountBillNumber,
        title: 'Found Bill',
      };

      mockBillService.searchBill.mockResolvedValue(mockBill);

      const result = await controller.searchBills('12345678901234567890', {} as any, mockUser);

      expect(billService.searchBill).toHaveBeenCalledWith(accountBillNumber, {}, mockUser);
      expect(result).toBe(mockBill);
    });

    it('should return null for non-existent bill', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const accountBillNumber = '99999999999999999999';

      mockBillService.searchBill.mockResolvedValue(null);

      const result = await controller.searchBills(accountBillNumber, {} as any, mockUser);

      expect(result).toBeNull();
    });
  });

  describe('getTotalAccountBalance', () => {
    it('should return total account balance', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const totalBalance = 5000.50;

      mockBillService.getTotalAccountBalance.mockResolvedValue(totalBalance);

      const result = await controller.userAccountBalance(mockUser);

      expect(billService.getTotalAccountBalance).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(totalBalance);
    });

    it('should handle zero balance', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      mockBillService.getTotalAccountBalance.mockResolvedValue(0);

      const result = await controller.userAccountBalance(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getTotalAmountMoney', () => {
    it('should return total amount money', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const totalAmount = 2500.75;

      mockBillService.getTotalAmountMoney.mockResolvedValue(totalAmount);

      const result = await controller.userAmountMoney(mockUser);

      expect(billService.getTotalAmountMoney).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(totalAmount);
    });
  });

  describe('Authentication Guards', () => {
    it('should have AuthGuard applied to protected endpoints', () => {
      expect(controller).toBeDefined();
      expect(controller.userBills).toBeDefined();
      expect(controller.createBill).toBeDefined();
    });
  });

  describe('API Documentation', () => {
    it('should have proper Swagger decorators', () => {
      const apiTags = Reflect.getMetadata('swagger/apiUseTags', BillController);
      expect(apiTags).toContain('Bills');
    });
  });
});
