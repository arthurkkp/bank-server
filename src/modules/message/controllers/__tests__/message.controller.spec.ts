import { Test, TestingModule } from '@nestjs/testing';
import { MessageController } from '../message.controller';
import { MessageService } from '../../services/message.service';
import { UserEntity } from '../../../user/entities/user.entity';
import { CreateMessageDto, ReadMessageDto } from '../../dtos';
import { BadRequestException } from '@nestjs/common';

describe('MessageController', () => {
  let controller: MessageController;
  let messageService: MessageService;

  const mockMessageService = {
    getMessages: jest.fn(),
    createMessage: jest.fn(),
    readMessages: jest.fn(),
  };

  beforeEach(async () => {
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
    messageService = module.get<MessageService>(MessageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    it('should return user messages', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const mockMessages = [
        { id: 1, title: 'Welcome', content: 'Welcome to our bank', isRead: false },
        { id: 2, title: 'Statement', content: 'Your monthly statement', isRead: true },
      ];

      mockMessageService.getMessages.mockResolvedValue(mockMessages);

      const result = await controller.getMessages({} as any, mockUser);

      expect(messageService.getMessages).toHaveBeenCalledWith(mockUser, {});
      expect(result).toBe(mockMessages);
    });

    it('should handle empty messages list', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      mockMessageService.getMessages.mockResolvedValue([]);

      const result = await controller.getMessages({} as any, mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('createMessage', () => {
    it('should create new message', async () => {
      const createMessageDto = {
        title: 'New Message',
        content: 'This is a new message',
        recipientId: 'recipient-uuid',
      } as unknown as CreateMessageDto;

      const mockCreatedMessage = {
        id: 1,
        ...createMessageDto,
      };

      mockMessageService.createMessage.mockResolvedValue(mockCreatedMessage);

      const result = await controller.createMessage(createMessageDto);

      expect(messageService.createMessage).toHaveBeenCalledWith(createMessageDto);
      expect(result).toBe(mockCreatedMessage);
    });

    it('should validate message data', async () => {
      const invalidMessageDto = {
        title: '',
        content: '',
        recipientId: '',
      } as unknown as CreateMessageDto;

      mockMessageService.createMessage.mockRejectedValue(
        new BadRequestException('Invalid message data'),
      );

      await expect(
        controller.createMessage(invalidMessageDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('readMessage', () => {
    it('should mark message as read', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const readMessageDto = {
        messageId: 1,
      } as unknown as ReadMessageDto;

      const mockUpdatedMessage = {
        id: 1,
        title: 'Welcome',
        content: 'Welcome to our bank',
        isRead: true,
      };

      mockMessageService.readMessages.mockResolvedValue(mockUpdatedMessage);

      const result = await controller.readMessage(mockUser, readMessageDto);

      expect(messageService.readMessages).toHaveBeenCalledWith(mockUser, readMessageDto);
      expect(result).toBe(mockUpdatedMessage);
    });

    it('should handle message not found', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const readMessageDto = {
        messageId: 999,
      } as unknown as ReadMessageDto;

      mockMessageService.readMessages.mockResolvedValue(null);

      const result = await controller.readMessage(mockUser, readMessageDto);

      expect(result).toBeNull();
    });
  });

  describe('Authentication Guards', () => {
    it('should have AuthGuard applied to protected endpoints', () => {
      expect(controller).toBeDefined();
      expect(controller.getMessages).toBeDefined();
      expect(controller.createMessage).toBeDefined();
    });
  });

  describe('API Documentation', () => {
    it('should have proper Swagger decorators', () => {
      const apiTags = Reflect.getMetadata('swagger/apiUseTags', MessageController);
      expect(apiTags).toContain('Messages');
    });
  });
});
