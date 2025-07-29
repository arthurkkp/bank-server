import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CurrencyRepository } from '../repositories';
import { createMockRepository, createMockCurrency } from '../../../test-utils';
import { CurrencyEntity } from '../entities';
import { CurrenciesPageOptionsDto } from '../dtos';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let currencyRepository: jest.Mocked<CurrencyRepository>;

  beforeEach(async () => {
    const mockCurrencyRepository = createMockRepository();
    const mockHttpService = {
      get: jest.fn().mockReturnValue({
        toPromise: jest.fn().mockResolvedValue({ data: {} }),
      }),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: CurrencyRepository,
          useValue: mockCurrencyRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
    currencyRepository = module.get(CurrencyRepository) as jest.Mocked<CurrencyRepository>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrencies', () => {
    it('should return paginated currencies', async () => {
      const pageOptions = new CurrenciesPageOptionsDto();
      const mockCurrencies = [createMockCurrency()];
      
      mockCurrencies.toDtos = jest.fn().mockReturnValue([{ id: 1, name: 'USD' }]);
      
      const mockQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCurrencies, 1]),
      };
      
      currencyRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.getCurrencies(pageOptions);

      expect(currencyRepository.createQueryBuilder).toHaveBeenCalledWith('currency');
      expect(result.data).toEqual([{ id: 1, name: 'USD' }]);
      expect(result.meta.itemCount).toBe(1);
    });
  });

  describe('findCurrency', () => {
    it('should find currency by uuid', async () => {
      const uuid = 'test-uuid';
      const mockCurrency = createMockCurrency();
      
      const mockQueryBuilder = {
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockCurrency),
      };
      
      currencyRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.findCurrency({ uuid });

      expect(currencyRepository.createQueryBuilder).toHaveBeenCalledWith('currency');
      expect(result).toBe(mockCurrency);
    });

    it('should find currency by name', async () => {
      const name = 'USD';
      const mockCurrency = createMockCurrency();
      
      const mockQueryBuilder = {
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockCurrency),
      };
      
      currencyRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.findCurrency({ name });

      expect(currencyRepository.createQueryBuilder).toHaveBeenCalledWith('currency');
      expect(result).toBe(mockCurrency);
    });
  });
});
