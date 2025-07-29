import { Test, TestingModule } from '@nestjs/testing';
import { UserConfigService } from './user-config.service';
import { UserConfigRepository } from '../repositories';
import { createMockRepository, createMockUser, createMockUserConfig } from '../../../test-utils';

describe('UserConfigService', () => {
  let service: UserConfigService;
  let userConfigRepository: jest.Mocked<UserConfigRepository>;

  beforeEach(async () => {
    const mockUserConfigRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserConfigService,
        {
          provide: UserConfigRepository,
          useValue: mockUserConfigRepository,
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
      const user = createMockUser();
      const mockUserConfig = createMockUserConfig();

      userConfigRepository.findOne.mockResolvedValue(mockUserConfig);
      userConfigRepository.save.mockResolvedValue(mockUserConfig);

      await service.setNotification(mockUserConfig);

      expect(userConfigRepository.save).toHaveBeenCalledWith(mockUserConfig);
      expect(userConfigRepository.save).toHaveBeenCalled();
    });
  });
});
