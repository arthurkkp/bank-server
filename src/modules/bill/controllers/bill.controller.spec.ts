import { Test, TestingModule } from '@nestjs/testing';
import { BillController } from './bill.controller';
import { BillService } from '../services';
import { createMockUser, createMockBill } from '../../../test-utils';
import { BillsPageOptionsDto, CreateBillDto } from '../dtos';

describe('BillController', () => {
  let controller: BillController;
  let billService: jest.Mocked<BillService>;

  beforeEach(async () => {
    const mockBillService = {
      getBills: jest.fn(),
      createAccountBill: jest.fn(),
      getTotalAmountMoney: jest.fn(),
      getTotalAccountBalance: jest.fn(),
      getTotalAccountBalanceHistory: jest.fn(),
      searchBill: jest.fn(),
    };

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
    billService = module.get(BillService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('userBills', () => {
    it('should return user bills', async () => {
      const user = createMockUser();
      const pageOptions = new BillsPageOptionsDto();
      const expectedResult = { data: [], meta: { itemCount: 0 } };

      billService.getBills.mockResolvedValue(expectedResult as any);

      const result = await controller.userBills(pageOptions, user);

      expect(billService.getBills).toHaveBeenCalledWith(user, pageOptions);
      expect(result).toBe(expectedResult);
    });
  });

  describe('createBill', () => {
    it('should create a new bill', async () => {
      const user = createMockUser();
      const createBillDto: CreateBillDto = {
        currency: 'usd-uuid',
      };
      const mockBill = createMockBill();
      const expectedDto = { id: 1, accountBillNumber: '123' };

      (mockBill as any).toDto = jest.fn().mockReturnValue(expectedDto);
      billService.createAccountBill.mockResolvedValue(mockBill);

      const result = await controller.createBill(user, createBillDto);

      expect(billService.createAccountBill).toHaveBeenCalledWith({
        user,
        currency: createBillDto.currency,
      });
      expect(result).toBe(expectedDto);
    });
  });

  describe('userAmountMoney', () => {
    it('should return user amount money', async () => {
      const user = createMockUser();
      const expectedResult = { amountMoney: '1000.00', currencyName: 'USD' };

      billService.getTotalAmountMoney.mockResolvedValue(expectedResult as any);

      const result = await controller.userAmountMoney(user);

      expect(billService.getTotalAmountMoney).toHaveBeenCalledWith(user);
      expect(result).toBe(expectedResult);
    });
  });

  describe('userAccountBalance', () => {
    it('should return user account balance', async () => {
      const user = createMockUser();
      const expectedResult = { revenues: '500.00', expenses: '200.00' };

      billService.getTotalAccountBalance.mockResolvedValue(expectedResult as any);

      const result = await controller.userAccountBalance(user);

      expect(billService.getTotalAccountBalance).toHaveBeenCalledWith(user);
      expect(result).toBe(expectedResult);
    });
  });

  describe('userAccountBalanceHistory', () => {
    it('should return user account balance history', async () => {
      const user = createMockUser();
      const expectedResult = { accountBalanceHistory: [100, 200, 300] };

      billService.getTotalAccountBalanceHistory.mockResolvedValue(expectedResult as any);

      const result = await controller.userAccountBalanceHistory(user);

      expect(billService.getTotalAccountBalanceHistory).toHaveBeenCalledWith(user);
      expect(result).toBe(expectedResult);
    });
  });

  describe('searchBills', () => {
    it('should search bills by account number', async () => {
      const user = createMockUser();
      const accountBillNumber = '12345';
      const pageOptions = new BillsPageOptionsDto();
      const expectedResult = { data: [], meta: { itemCount: 0 } };

      billService.searchBill.mockResolvedValue(expectedResult as any);

      const result = await controller.searchBills(accountBillNumber, pageOptions, user);

      expect(billService.searchBill).toHaveBeenCalledWith(accountBillNumber, pageOptions, user);
      expect(result).toBe(expectedResult);
    });
  });
});
