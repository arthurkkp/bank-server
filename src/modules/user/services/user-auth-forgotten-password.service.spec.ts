import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthForgottenPasswordService } from './user-auth-forgotten-password.service';
import { UserAuthForgottenPasswordRepository } from '../repositories';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { createMockRepository, createMockMailerService, createMockConfigService, createMockUser } from '../../../test-utils';

describe('UserAuthForgottenPasswordService', () => {
  let service: UserAuthForgottenPasswordService;
  let repository: jest.Mocked<UserAuthForgottenPasswordRepository>;
  let mailerService: jest.Mocked<MailerService>;

  beforeEach(async () => {
    const mockRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAuthForgottenPasswordService,
        {
          provide: UserAuthForgottenPasswordRepository,
          useValue: mockRepository,
        },
        {
          provide: MailerService,
          useValue: createMockMailerService(),
        },
        {
          provide: ConfigService,
          useValue: createMockConfigService(),
        },
      ],
    }).compile();

    service = module.get<UserAuthForgottenPasswordService>(UserAuthForgottenPasswordService);
    repository = module.get(UserAuthForgottenPasswordRepository);
    mailerService = module.get(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createForgottenPassword', () => {
    it('should create forgotten password record', async () => {
      const user = createMockUser();
      const hashedToken = 'hashed-token';
      const mockRecord = { id: 1, user, hashedToken };

      repository.create.mockReturnValue(mockRecord as any);
      repository.save.mockResolvedValue(mockRecord as any);

      const result = await service.createForgottenPassword({ user, hashedToken } as any);

      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(mockRecord);
      expect(result).toBe(mockRecord);
    });
  });

  describe('sendEmailWithToken', () => {
    it('should send email with reset token', async () => {
      const user = createMockUser();
      const token = 'reset-token';
      const locale = 'en';

      await service.sendEmailWithToken(user, token, locale);

      expect(mailerService.sendMail).toHaveBeenCalled();
    });
  });
});
