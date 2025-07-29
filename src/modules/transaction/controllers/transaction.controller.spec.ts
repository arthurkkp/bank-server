import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { TransactionController } from './transaction.controller';
import { TransactionService } from '../services';
import { createMockUser, createMockTransaction } from '../../../test-utils';
import { CreateTransactionDto, ConfirmTransactionDto, TransactionsPageOptionsDto } from '../dtos';

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionService: jest.Mocked<TransactionService>;

  beforeEach(async () => {
    const mockTransactionService = {
      getTransactions: jest.fn(),
      createTransaction: jest.fn(),
      confirmTransaction: jest.fn(),
      getTransaction: jest.fn(),
      getConfirmationDocumentFile: jest.fn(),
      htmlToPdfBuffer: jest.fn(),
      getReadableStream: jest.fn(),
    };

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
    transactionService = module.get(TransactionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTransactions', () => {
    it('should return user transactions', async () => {
      const user = createMockUser();
      const pageOptions = new TransactionsPageOptionsDto();
      const expectedResult = { data: [], meta: { itemCount: 0 } };

      transactionService.getTransactions.mockResolvedValue(expectedResult as any);

      const result = await controller.getTransactions(pageOptions, user);

      expect(transactionService.getTransactions).toHaveBeenCalledWith(user, pageOptions);
      expect(result).toBe(expectedResult);
    });
  });

  describe('createTransaction', () => {
    it('should create a new transaction', async () => {
      const user = createMockUser();
      const createTransactionDto: CreateTransactionDto = {
        recipientBill: 'recipient-uuid',
        senderBill: 'sender-uuid',
        amountMoney: 100,
        transferTitle: 'Test Transfer',
        locale: 'en' as any,
      };
      const mockTransaction = createMockTransaction();

      transactionService.createTransaction.mockResolvedValue(mockTransaction);

      const result = await controller.createTransaction(user, createTransactionDto);

      expect(transactionService.createTransaction).toHaveBeenCalledWith(user, createTransactionDto);
      expect(result.uuid).toBe((mockTransaction as any).uuid);
    });
  });

  describe('confirmTransaction', () => {
    it('should confirm a transaction', async () => {
      const user = createMockUser();
      const confirmTransactionDto: ConfirmTransactionDto = {
        authorizationKey: 'ABC123',
      };

      transactionService.confirmTransaction.mockResolvedValue(undefined);

      await controller.confirmTransaction(user, confirmTransactionDto);

      expect(transactionService.confirmTransaction).toHaveBeenCalledWith(user, confirmTransactionDto);
    });
  });

  describe('getAuthorizationKey', () => {
    it('should return authorization key', async () => {
      const user = createMockUser();
      const uuid = 'test-uuid';
      const mockTransaction = createMockTransaction();

      transactionService.getTransaction.mockResolvedValue(mockTransaction);

      const result = await controller.getAuthorizationKey(uuid, user);

      expect(transactionService.getTransaction).toHaveBeenCalledWith({
        uuid,
        sender: user,
      });
      expect(result.authorizationKey).toBe(mockTransaction.authorizationKey);
    });
  });

  describe('getConfirmation', () => {
    it('should generate and return PDF confirmation', async () => {
      const user = createMockUser();
      const uuid = 'test-uuid';
      const locale = 'en';
      const mockResponse = {
        set: jest.fn(),
        pipe: jest.fn(),
      } as unknown as Response;
      const mockStream = {
        pipe: jest.fn(),
      };

      transactionService.getConfirmationDocumentFile.mockResolvedValue('<html>Test</html>');
      transactionService.htmlToPdfBuffer.mockResolvedValue(Buffer.from('pdf-data'));
      transactionService.getReadableStream.mockReturnValue(mockStream as any);

      await controller.getConfirmation(uuid, locale, user, mockResponse);

      expect(transactionService.getConfirmationDocumentFile).toHaveBeenCalledWith(user, uuid, locale);
      expect(transactionService.htmlToPdfBuffer).toHaveBeenCalledWith('<html>Test</html>');
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Length': 8,
      });
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
    });
  });
});
