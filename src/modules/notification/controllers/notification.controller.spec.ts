import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { TransactionService } from '../../transaction/services';
import { UserConfigService } from '../../user/services';

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const mockTransactionService = {
      getTransactions: jest.fn(),
    };
    const mockUserConfigService = {
      setNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
        {
          provide: UserConfigService,
          useValue: mockUserConfigService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
