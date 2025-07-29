import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillService } from './bill.service';
import { BillRepository } from '../repositories';
import { TransactionRepository } from '../../transaction/repositories';
import { CurrencyService } from '../../currency/services';
import { BillEntity } from '../entities';
import { TransactionEntity } from '../../transaction/entities';
import { createMockRepository, createMockUser, createMockBill, createMockCurrency } from '../../../test-utils';
import { CurrencyNotFoundException, CreateNewBillFailedException, AccountBillNumberGenerationIncorrect } from '../../../exceptions';
import { BillsPageOptionsDto } from '../dtos';

describe('BillService', () => {
  let service: BillService;
  let billRepository: jest.Mocked<BillRepository>;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let currencyService: jest.Mocked<CurrencyService>;

  beforeEach(async () => {
    const mockBillRepository = createMockRepository();
    const mockTransactionRepository = createMockRepository();
    const mockCurrencyService = {
      findCurrency: jest.fn(),
    };

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
    billRepository = module.get(BillRepository);
    transactionRepository = module.get(TransactionRepository);
    currencyService = module.get(CurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBills', () => {
    it('should return paginated bills with calculated amounts', async () => {
      const user = createMockUser();
      const pageOptions = new BillsPageOptionsDto();
      const mockBills = [createMockBill()];
      const mockQueryBuilder = billRepository.createQueryBuilder();

      mockQueryBuilder.getManyAndCount = jest.fn().mockResolvedValue([mockBills, 1]);
      mockBills[0].toDto = jest.fn().mockReturnValue({ id: 1, accountBillNumber: '123' });

      const result = await service.getBills(user, pageOptions);

      expect(billRepository.createQueryBuilder).toHaveBeenCalledWith('bills');
      expect(result.data).toEqual([{ id: 1, accountBillNumber: '123' }]);
      expect(result.meta.itemCount).toBe(1);
    });
  });

  describe('getBill', () => {
    it('should return a single bill with calculated amount', async () => {
      const user = createMockUser();
      const mockBill = createMockBill();
      const mockQueryBuilder = billRepository.createQueryBuilder();

      mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockBill);
      mockBill.toDto = jest.fn().mockReturnValue({ id: 1, accountBillNumber: '123' });

      const result = await service.getBill(user);

      expect(billRepository.createQueryBuilder).toHaveBeenCalledWith('bill');
      expect(result).toEqual({ id: 1, accountBillNumber: '123' });
    });
  });

  describe('createAccountBill', () => {
    it('should create a new bill successfully', async () => {
      const user = createMockUser();
      const currency = createMockCurrency();
      const createdUser = { user, currency: currency.uuid };
      const mockBill = createMockBill();

      jest.spyOn(service, '_createBillNumber' as any).mockResolvedValue('1234567890123456789012345');
      currencyService.findCurrency.mockResolvedValue(currency);
      jest.spyOn(service, 'getBills').mockResolvedValue({ meta: { itemCount: 2 } } as any);
      billRepository.create.mockReturnValue(mockBill);
      billRepository.save.mockResolvedValue(mockBill);

      const result = await service.createAccountBill(createdUser);

      expect(currencyService.findCurrency).toHaveBeenCalledWith({ uuid: currency.uuid });
      expect(billRepository.create).toHaveBeenCalled();
      expect(billRepository.save).toHaveBeenCalledWith(mockBill);
      expect(result).toBe(mockBill);
    });

    it('should throw CurrencyNotFoundException when currency not found', async () => {
      const user = createMockUser();
      const createdUser = { user, currency: 'invalid-uuid' };

      jest.spyOn(service, '_createBillNumber' as any).mockResolvedValue('1234567890123456789012345');
      currencyService.findCurrency.mockResolvedValue(null);

      await expect(service.createAccountBill(createdUser)).rejects.toThrow(CurrencyNotFoundException);
    });

    it('should throw CreateNewBillFailedException when user has 5 bills', async () => {
      const user = createMockUser();
      const currency = createMockCurrency();
      const createdUser = { user, currency: currency.uuid };

      jest.spyOn(service, '_createBillNumber' as any).mockResolvedValue('1234567890123456789012345');
      currencyService.findCurrency.mockResolvedValue(currency);
      jest.spyOn(service, 'getBills').mockResolvedValue({ meta: { itemCount: 5 } } as any);

      await expect(service.createAccountBill(createdUser)).rejects.toThrow(CreateNewBillFailedException);
    });
  });

  describe('searchBill', () => {
    it('should search bills by account number', async () => {
      const accountBillNumber = '12345';
      const pageOptions = new BillsPageOptionsDto();
      const user = createMockUser();
      const mockBills = [createMockBill()];
      const mockQueryBuilder = billRepository.createQueryBuilder();

      mockQueryBuilder.getManyAndCount = jest.fn().mockResolvedValue([mockBills, 1]);
      mockBills[0].toDto = jest.fn().mockReturnValue({ id: 1, accountBillNumber: '123' });

      const result = await service.searchBill(accountBillNumber, pageOptions, user);

      expect(billRepository.createQueryBuilder).toHaveBeenCalledWith('bills');
      expect(result.data).toEqual([{ id: 1, accountBillNumber: '123' }]);
    });
  });

  describe('findBill', () => {
    it('should find bill by uuid', async () => {
      const uuid = 'test-uuid';
      const user = createMockUser();
      const mockBill = createMockBill();
      const mockQueryBuilder = billRepository.createQueryBuilder();

      mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockBill);

      const result = await service.findBill(uuid, user);

      expect(billRepository.createQueryBuilder).toHaveBeenCalledWith('bill');
      expect(result).toBe(mockBill);
    });
  });

  describe('_generateBillNumber', () => {
    it('should generate a valid bill number', () => {
      const billNumber = service['_generateBillNumber']();
      
      expect(billNumber).toMatch(/^\d{26}$/);
      expect(billNumber.substring(2, 10)).toBe('28229297');
    });
  });

  describe('_createBillNumber', () => {
    it('should create unique bill number', async () => {
      jest.spyOn(service, '_generateBillNumber' as any).mockReturnValue('1234567890123456789012345');
      jest.spyOn(service, 'searchBill').mockResolvedValue({ data: [] } as any);

      const result = await service['_createBillNumber']();

      expect(result).toBe('1234567890123456789012345');
    });

    it('should retry if bill number already exists', async () => {
      jest.spyOn(service, '_generateBillNumber' as any)
        .mockReturnValueOnce('1111111111111111111111111')
        .mockReturnValueOnce('2222222222222222222222222');
      jest.spyOn(service, 'searchBill')
        .mockResolvedValueOnce({ data: [createMockBill()] } as any)
        .mockResolvedValueOnce({ data: [] } as any);

      const result = await service['_createBillNumber']();

      expect(result).toBe('2222222222222222222222222');
    });
  });
});
