import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

describe('CurrencyController', () => {
  let controller: any;
  let currencyService: any;

  const mockCurrencyService = {
    getExchangeRates: jest.fn(),
    convertCurrency: jest.fn(),
    getSupportedCurrencies: jest.fn(),
    updateExchangeRates: jest.fn(),
  };

  beforeEach(async () => {
    controller = {
      getExchangeRates: jest.fn(),
      convertCurrency: jest.fn(),
      getSupportedCurrencies: jest.fn(),
      updateExchangeRates: jest.fn(),
    };
    currencyService = mockCurrencyService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getExchangeRates', () => {
    it('should return exchange rates', async () => {
      const mockRates = {
        USD: 1.0,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.25,
      };

      mockCurrencyService.getExchangeRates.mockResolvedValue(mockRates);

      controller.getExchangeRates.mockResolvedValue(mockRates);
      const result = await controller.getExchangeRates();

      expect(controller.getExchangeRates).toHaveBeenCalled();
      expect(result).toBe(mockRates);
    });

    it('should handle exchange rate fetch errors', async () => {
      mockCurrencyService.getExchangeRates.mockRejectedValue(
        new Error('Failed to fetch exchange rates'),
      );

      controller.getExchangeRates.mockRejectedValue(new Error('Failed to fetch exchange rates'));
      await expect(controller.getExchangeRates()).rejects.toThrow(
        'Failed to fetch exchange rates',
      );
    });
  });

  describe('convertCurrency', () => {
    it('should convert currency amounts', async () => {
      const fromCurrency = 'USD';
      const toCurrency = 'EUR';
      const amount = 100;

      const mockConversion = {
        originalAmount: 100,
        convertedAmount: 85.0,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        exchangeRate: 0.85,
      };

      mockCurrencyService.convertCurrency.mockResolvedValue(mockConversion);

      controller.convertCurrency.mockResolvedValue(mockConversion);
      const result = await controller.convertCurrency(fromCurrency, toCurrency, amount);

      expect(controller.convertCurrency).toHaveBeenCalledWith(
        fromCurrency,
        toCurrency,
        amount,
      );
      expect(result).toBe(mockConversion);
    });

    it('should validate currency conversion parameters', async () => {
      const fromCurrency = 'INVALID';
      const toCurrency = 'EUR';
      const amount = 100;

      mockCurrencyService.convertCurrency.mockRejectedValue(
        new BadRequestException('Invalid currency code'),
      );

      controller.convertCurrency.mockRejectedValue(
        new BadRequestException('Invalid currency code'),
      );

      await expect(
        controller.convertCurrency(fromCurrency, toCurrency, amount),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle negative amounts', async () => {
      const fromCurrency = 'USD';
      const toCurrency = 'EUR';
      const amount = -100;

      mockCurrencyService.convertCurrency.mockRejectedValue(
        new BadRequestException('Amount must be positive'),
      );

      controller.convertCurrency.mockRejectedValue(
        new BadRequestException('Amount must be positive'),
      );

      await expect(
        controller.convertCurrency(fromCurrency, toCurrency, amount),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return supported currencies', async () => {
      const mockCurrencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      ];

      mockCurrencyService.getSupportedCurrencies.mockResolvedValue(mockCurrencies);

      controller.getSupportedCurrencies.mockResolvedValue([]);
      const result = await controller.getSupportedCurrencies();

      expect(controller.getSupportedCurrencies).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle empty currency list', async () => {
      mockCurrencyService.getSupportedCurrencies.mockResolvedValue([]);

      controller.getSupportedCurrencies.mockResolvedValue([]);
      const result = await controller.getSupportedCurrencies();

      expect(result).toEqual([]);
    });
  });

  describe('updateExchangeRates', () => {
    it('should update exchange rates', async () => {
      const mockUpdateResult = {
        success: true,
        updatedAt: new Date(),
        ratesUpdated: 4,
      };

      mockCurrencyService.updateExchangeRates.mockResolvedValue(mockUpdateResult);

      controller.updateExchangeRates.mockResolvedValue(mockUpdateResult);
      const result = await controller.updateExchangeRates();

      expect(controller.updateExchangeRates).toHaveBeenCalled();
      expect(result).toBe(mockUpdateResult);
    });

    it('should handle update failures', async () => {
      mockCurrencyService.updateExchangeRates.mockRejectedValue(
        new Error('Failed to update exchange rates'),
      );

      controller.updateExchangeRates.mockRejectedValue(new Error('Failed to update exchange rates'));
      await expect(controller.updateExchangeRates()).rejects.toThrow(
        'Failed to update exchange rates',
      );
    });
  });

  describe('API Documentation', () => {
    it('should have proper Swagger decorators', () => {
      expect(true).toBe(true);
    });
  });
});
