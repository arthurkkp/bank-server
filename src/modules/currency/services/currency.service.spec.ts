import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import { CurrencyRepository } from '../repositories';
import { createMockRepository, createMockCurrency } from '../../../test-utils';
import { CurrencyEntity } from '../entities';
import { CurrenciesPageOptionsDto } from '../dtos';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let currencyRepository: jest.Mocked<CurrencyRepository>;

  beforeEach(async () => {
    const mockCurrencyRepository = createMockRepository<CurrencyEntity>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: CurrencyRepository,
          useValue: mockCurrencyRepository,
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
    currencyRepository = module.get(CurrencyRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrencies', () => {
    it('should return paginated currencies', async () => {
      const pageOptions = new CurrenciesPageOptionsDto();
      const mockCurrencies = [createMockCurrency()];
      const mockQueryBuilder = currencyRepository.createQueryBuilder();

      mockQueryBuilder.getManyAndCount = jest.fn().mockResolvedValue([mockCurrencies, 1]);
      mockCurrencies[0].toDto = jest.fn().mockReturnValue({ id: 1, name: 'USD' });

      const result = await service.getCurrencies(pageOptions);

      expect(currencyRepository.createQueryBuilder).toHaveBeenCalledWith('currencies');
      expect(result.data).toEqual([{ id: 1, name: 'USD' }]);
      expect(result.meta.itemCount).toBe(1);
    });
  });

  describe('findCurrency', () => {
    it('should find currency by uuid', async () => {
      const uuid = 'test-uuid';
      const mockCurrency = createMockCurrency();

      currencyRepository.findOne.mockResolvedValue(mockCurrency);

      const result = await service.findCurrency({ uuid });

      expect(currencyRepository.findOne).toHaveBeenCalledWith({ uuid });
      expect(result).toBe(mockCurrency);
    });

    it('should find currency by name', async () => {
      const name = 'USD';
      const mockCurrency = createMockCurrency();

      currencyRepository.findOne.mockResolvedValue(mockCurrency);

      const result = await service.findCurrency({ name });

      expect(currencyRepository.findOne).toHaveBeenCalledWith({ name });
      expect(result).toBe(mockCurrency);
    });
  });
});
