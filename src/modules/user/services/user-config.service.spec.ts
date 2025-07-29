import { Test, TestingModule } from '@nestjs/testing';
import { UserConfigService } from './user-config.service';
import { UserConfigRepository } from '../repositories';
import { CurrencyService } from '../../currency/services';
import { createMockRepository, createMockUser, createMockUserConfig } from '../../../test-utils';

describe('UserConfigService', () => {
  let service: UserConfigService;
  let userConfigRepository: jest.Mocked<UserConfigRepository>;

  beforeEach(async () => {
    const mockUserConfigRepository = createMockRepository();
    const mockCurrencyService = {
      findCurrency: jest.fn().mockResolvedValue({ uuid: 'currency-uuid' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserConfigService,
        {
          provide: UserConfigRepository,
          useValue: mockUserConfigRepository,
        },
        {
          provide: CurrencyService,
          useValue: mockCurrencyService,
        },
      ],
    }).compile();

    service = module.get<UserConfigService>(UserConfigService);
    userConfigRepository = module.get(UserConfigRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUserConfig', () => {
    it('should create user config', async () => {
      const user = createMockUser();
      const mockUserConfig = createMockUserConfig();

      userConfigRepository.create.mockReturnValue(mockUserConfig);
      userConfigRepository.save.mockResolvedValue(mockUserConfig);

      const result = await service.createUserConfig(user);

      expect(userConfigRepository.create).toHaveBeenCalled();
      expect(userConfigRepository.save).toHaveBeenCalledWith(mockUserConfig);
      expect(result).toBe(mockUserConfig);
    });
  });

  describe('setNotification', () => {
    it('should update notification count', async () => {
      const mockUserConfig = createMockUserConfig();

      const result = await service.setNotification(mockUserConfig);

      expect(userConfigRepository.createQueryBuilder).toHaveBeenCalledWith('userConfig');
    });
  });
});
