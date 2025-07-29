import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { MessageRepository } from '../repositories';
import { MessageKeyService } from './message-key.service';
import { MessageTemplateService } from './message-template.service';
import { UserService } from '../../user/services';
import { createMockRepository, createMockUser } from '../../../test-utils';
import { MessageEntity } from '../entities';
import { MessagesPageOptionsDto } from '../dtos';

describe('MessageService', () => {
  let service: MessageService;
  let messageRepository: jest.Mocked<MessageRepository>;

  beforeEach(async () => {
    const mockMessageRepository = createMockRepository();
    const mockMessageKeyService = {
      getMessageKey: jest.fn(),
    };
    const mockMessageTemplateService = {
      getMessageTemplate: jest.fn(),
    };
    const mockUserService = {
      getUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: MessageRepository,
          useValue: mockMessageRepository,
        },
        {
          provide: MessageKeyService,
          useValue: mockMessageKeyService,
        },
        {
          provide: MessageTemplateService,
          useValue: mockMessageTemplateService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    messageRepository = module.get(MessageRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMessages', () => {
    it('should return paginated messages', async () => {
      const user = createMockUser();
      const pageOptions = new MessagesPageOptionsDto();
      const mockMessages = [{ id: 1, subject: 'Test Message' }];
      const mockQueryBuilder = messageRepository.createQueryBuilder();

      mockQueryBuilder.getManyAndCount = jest.fn().mockResolvedValue([mockMessages, 1]);

      const result = await service.getMessages(user, pageOptions);

      expect(messageRepository.createQueryBuilder).toHaveBeenCalledWith('messages');
      expect(result.meta.itemCount).toBe(1);
    });
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      const messageData = {
        subject: 'Test Subject',
        content: 'Test Content',
        user: createMockUser(),
      };
      const mockMessage = { id: 1, ...messageData };

      messageRepository.create.mockReturnValue(mockMessage as any);
      messageRepository.save.mockResolvedValue(mockMessage as any);

      const result = await service.createMessage(messageData as any);

      expect(messageRepository.create).toHaveBeenCalledWith(messageData);
      expect(messageRepository.save).toHaveBeenCalledWith(mockMessage);
      expect(result).toBe(mockMessage);
    });
  });
});
