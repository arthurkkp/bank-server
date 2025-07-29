import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from '../services';
import { CurrenciesPageOptionsDto } from '../dtos';

describe('CurrencyController', () => {
  let controller: CurrencyController;
  let currencyService: jest.Mocked<CurrencyService>;

  beforeEach(async () => {
    const mockCurrencyService = {
      getCurrencies: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrencyController],
      providers: [
        {
          provide: CurrencyService,
          useValue: mockCurrencyService,
        },
      ],
    }).compile();

    controller = module.get<CurrencyController>(CurrencyController);
    currencyService = module.get(CurrencyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAvailableCurrencies', () => {
    it('should return available currencies', async () => {
      const pageOptions = new CurrenciesPageOptionsDto();
      const expectedResult = { data: [], meta: { itemCount: 0 } };

      currencyService.getCurrencies.mockResolvedValue(expectedResult as any);

      const result = await controller.getAvailableCurrencies(pageOptions);

      expect(currencyService.getCurrencies).toHaveBeenCalledWith(pageOptions);
      expect(result).toBe(expectedResult);
    });
  });
});
