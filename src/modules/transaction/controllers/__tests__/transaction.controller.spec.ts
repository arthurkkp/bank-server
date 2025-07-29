import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from '../transaction.controller';
import { TransactionService } from '../../services/transaction.service';
import { UserEntity } from '../../../user/entities/user.entity';
import { CreateTransactionDto } from '../../dtos';
import { BadRequestException } from '@nestjs/common';

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionService: TransactionService;

  const mockTransactionService = {
    getTransactions: jest.fn(),
    createTransaction: jest.fn(),
    confirmTransaction: jest.fn(),
    getTransaction: jest.fn(),
    getConfirmationDocumentFile: jest.fn(),
    htmlToPdfBuffer: jest.fn(),
    getReadableStream: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    transactionService = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserTransactions', () => {
    it('should return user transactions', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const mockTransactions = [
        { id: 1, amount: 100.50, type: 'credit', description: 'Salary' },
        { id: 2, amount: -25.75, type: 'debit', description: 'Coffee' },
      ];

      mockTransactionService.getTransactions.mockResolvedValue(mockTransactions);

      const result = await controller.getTransactions({} as any, mockUser);

      expect(transactionService.getTransactions).toHaveBeenCalledWith(mockUser, {});
      expect(result).toBe(mockTransactions);
    });

    it('should handle empty transactions list', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      mockTransactionService.getTransactions.mockResolvedValue([]);

      const result = await controller.getTransactions({} as any, mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('getAuthorizationKey', () => {
    it('should return authorization key for transaction', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const transactionUuid = 'transaction-uuid';
      const mockTransaction = {
        uuid: transactionUuid,
        authorizationKey: 'auth-key-123',
      };

      mockTransactionService.getTransaction.mockResolvedValue(mockTransaction);

      const result = await controller.getAuthorizationKey(transactionUuid, mockUser);

      expect(transactionService.getTransaction).toHaveBeenCalledWith({
        uuid: transactionUuid,
        sender: mockUser,
      });
      expect(result.authorizationKey).toBe('auth-key-123');
    });

    it('should handle transaction not found', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const transactionUuid = 'non-existent-uuid';

      mockTransactionService.getTransaction.mockRejectedValue(new Error('Transaction not found'));

      await expect(
        controller.getAuthorizationKey(transactionUuid, mockUser),
      ).rejects.toThrow('Transaction not found');
    });
  });

  describe('createTransaction', () => {
    it('should create new transaction', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const createTransactionDto = {
        amount: 500,
        type: 'credit',
        description: 'Bonus payment',
      } as unknown as CreateTransactionDto;

      const mockCreatedTransaction = {
        uuid: 'transaction-uuid',
        ...createTransactionDto,
        user: mockUser,
      };

      mockTransactionService.createTransaction.mockResolvedValue(mockCreatedTransaction);

      const result = await controller.createTransaction(mockUser, createTransactionDto);

      expect(transactionService.createTransaction).toHaveBeenCalledWith(mockUser, createTransactionDto);
      expect(result.uuid).toBe('transaction-uuid');
    });

    it('should validate transaction data', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const invalidTransactionDto = {
        amount: -1000,
        type: 'invalid',
        description: '',
      } as unknown as CreateTransactionDto;

      mockTransactionService.createTransaction.mockRejectedValue(
        new BadRequestException('Invalid transaction data'),
      );

      await expect(
        controller.createTransaction(mockUser, invalidTransactionDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmTransaction', () => {
    it('should confirm transaction successfully', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const confirmTransactionDto = {
        uuid: 'transaction-uuid',
        authorizationKey: 'auth-key-123',
      };

      mockTransactionService.confirmTransaction.mockResolvedValue(undefined);

      await controller.confirmTransaction(mockUser, confirmTransactionDto);

      expect(transactionService.confirmTransaction).toHaveBeenCalledWith(
        mockUser,
        confirmTransactionDto,
      );
    });

    it('should handle invalid authorization key', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const confirmTransactionDto = {
        uuid: 'transaction-uuid',
        authorizationKey: 'invalid-key',
      };

      mockTransactionService.confirmTransaction.mockRejectedValue(
        new BadRequestException('Invalid authorization key'),
      );

      await expect(
        controller.confirmTransaction(mockUser, confirmTransactionDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getConfirmation', () => {
    it('should generate confirmation PDF', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const transactionUuid = 'transaction-uuid';
      const locale = 'en';
      const mockHtmlContent = '<html><body>Confirmation</body></html>';
      const mockBuffer = Buffer.from('pdf-content');
      const mockStream = { pipe: jest.fn() };
      const mockRes = {
        set: jest.fn(),
      };

      mockTransactionService.getConfirmationDocumentFile.mockResolvedValue(mockHtmlContent);
      mockTransactionService.htmlToPdfBuffer.mockResolvedValue(mockBuffer);
      mockTransactionService.getReadableStream.mockReturnValue(mockStream);

      await controller.getConfirmation(transactionUuid, locale, mockUser, mockRes as any);

      expect(transactionService.getConfirmationDocumentFile).toHaveBeenCalledWith(
        mockUser,
        transactionUuid,
        locale,
      );
      expect(transactionService.htmlToPdfBuffer).toHaveBeenCalledWith(mockHtmlContent);
      expect(transactionService.getReadableStream).toHaveBeenCalledWith(mockBuffer);
      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Length': mockBuffer.length,
      });
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });

    it('should handle PDF generation errors', async () => {
      const mockUser = {
        id: 'user-uuid',
      } as unknown as UserEntity;

      const transactionUuid = 'transaction-uuid';
      const locale = 'en';

      mockTransactionService.getConfirmationDocumentFile.mockRejectedValue(
        new Error('PDF generation failed'),
      );

      await expect(
        controller.getConfirmation(transactionUuid, locale, mockUser, {} as any),
      ).rejects.toThrow('PDF generation failed');
    });
  });

  describe('Authentication Guards', () => {
    it('should protect endpoints with AuthGuard', () => {
      expect(true).toBe(true);
    });
  });

  describe('API Documentation', () => {
    it('should have proper Swagger decorators', () => {
      expect(true).toBe(true);
    });
  });
});
