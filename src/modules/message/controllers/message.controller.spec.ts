import { Test, TestingModule } from '@nestjs/testing';
import { MessageController } from './message.controller';
import { MessageService } from '../services';
import { createMockUser } from '../../../test-utils';
import { MessagesPageOptionsDto } from '../dtos';

describe('MessageController', () => {
  let controller: MessageController;
  let messageService: jest.Mocked<MessageService>;

  beforeEach(async () => {
    const mockMessageService = {
      getMessages: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        {
          provide: MessageService,
          useValue: mockMessageService,
        },
      ],
    }).compile();

    controller = module.get<MessageController>(MessageController);
    messageService = module.get(MessageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMessages', () => {
    it('should return user messages', async () => {
      const user = createMockUser();
      const pageOptions = new MessagesPageOptionsDto();
      const expectedResult = { data: [], meta: { itemCount: 0 } };

      messageService.getMessages.mockResolvedValue(expectedResult as any);

      const result = await controller.getMessages(pageOptions, user);

      expect(messageService.getMessages).toHaveBeenCalledWith(user, pageOptions);
      expect(result).toBe(expectedResult);
    });
  });
});
