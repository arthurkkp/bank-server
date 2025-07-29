import { Test, TestingModule } from '@nestjs/testing';
import { LanguageService } from './language.service';
import { LanguageRepository } from '../repositories';
import { createMockRepository } from '../../../test-utils';
import { LanguageEntity } from '../entities';

describe('LanguageService', () => {
  let service: LanguageService;
  let languageRepository: jest.Mocked<LanguageRepository>;

  beforeEach(async () => {
    const mockLanguageRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LanguageService,
        {
          provide: LanguageRepository,
          useValue: mockLanguageRepository,
        },
      ],
    }).compile();

    service = module.get<LanguageService>(LanguageService);
    languageRepository = module.get(LanguageRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLanguage', () => {
    it('should find language by name', async () => {
      const name = 'en';
      const mockLanguage = { id: 1, name: 'en', locale: 'en-US' };

      languageRepository.findOne.mockResolvedValue(mockLanguage as any);

      const result = await service.getLanguage(name);

      expect(languageRepository.findOne).toHaveBeenCalledWith({ name });
      expect(result).toBe(mockLanguage);
    });

    it('should find language by locale', async () => {
      const locale = 'en-US';
      const mockLanguage = { id: 1, name: 'en', locale: 'en-US' };

      languageRepository.findOne.mockResolvedValue(mockLanguage as any);

      const result = await service.getLanguage(locale);

      expect(languageRepository.findOne).toHaveBeenCalledWith({ locale });
      expect(result).toBe(mockLanguage);
    });
  });
});
