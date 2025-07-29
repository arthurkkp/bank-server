import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { TransactionService } from './transaction.service';
import { TransactionRepository } from '../repositories';
import { BillRepository } from '../../bill/repositories';
import { BillService } from '../../bill/services';
import { ValidatorService } from '../../../utils/services';
import { UserConfigService } from '../../user/services';
import { LanguageService } from '../../language/services';
import { TransactionEntity } from '../entities';
import { BillEntity } from '../../bill/entities';
import { createMockRepository, createMockMailerService, createMockConfigService } from '../../../test-utils';
import { createMockUser, createMockBill, createMockTransaction } from '../../../test-utils';
import { CreateTransactionDto, ConfirmTransactionDto, TransactionsPageOptionsDto } from '../dtos';
import { TransactionNotFoundException } from '../../../exceptions';

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let billRepository: jest.Mocked<BillRepository>;
  let billService: jest.Mocked<BillService>;
  let validatorService: jest.Mocked<ValidatorService>;
  let mailerService: jest.Mocked<MailerService>;
  let userConfigService: jest.Mocked<UserConfigService>;
  let languageService: jest.Mocked<LanguageService>;

  beforeEach(async () => {
    const mockTransactionRepository = createMockRepository();
    const mockBillRepository = createMockRepository();
    const mockBillService = {
      findBill: jest.fn(),
    };
    const mockValidatorService = {
      isCorrectRecipient: jest.fn(),
      isCorrectAmountMoney: jest.fn(),
      isHigherRole: jest.fn(),
    };
    const mockUserConfigService = {
      setNotification: jest.fn(),
    };
    const mockLanguageService = {
      getLanguage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: TransactionRepository,
          useValue: mockTransactionRepository,
        },
        {
          provide: BillRepository,
          useValue: mockBillRepository,
        },
        {
          provide: BillService,
          useValue: mockBillService,
        },
        {
          provide: ValidatorService,
          useValue: mockValidatorService,
        },
        {
          provide: MailerService,
          useValue: createMockMailerService(),
        },
        {
          provide: UserConfigService,
          useValue: mockUserConfigService,
        },
        {
          provide: LanguageService,
          useValue: mockLanguageService,
        },
        {
          provide: ConfigService,
          useValue: createMockConfigService(),
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    transactionRepository = module.get(TransactionRepository);
    billRepository = module.get(BillRepository);
    billService = module.get(BillService);
    validatorService = module.get(ValidatorService);
    mailerService = module.get(MailerService);
    userConfigService = module.get(UserConfigService);
    languageService = module.get(LanguageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const user = createMockUser();
      const pageOptions = new TransactionsPageOptionsDto();
      const mockTransactions = [createMockTransaction()];
      const mockQueryBuilder = transactionRepository.createQueryBuilder();

      mockQueryBuilder.getManyAndCount = jest.fn().mockResolvedValue([mockTransactions, 1]);
      mockTransactions[0].toDto = jest.fn().mockReturnValue({ id: 1, amountMoney: 100 });

      const result = await service.getTransactions(user, pageOptions);

      expect(transactionRepository.createQueryBuilder).toHaveBeenCalledWith('transactions');
      expect(result.data).toEqual([{ id: 1, amountMoney: 100 }]);
      expect(result.meta.itemCount).toBe(1);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction by uuid', async () => {
      const options = { uuid: 'test-uuid' };
      const mockTransaction = createMockTransaction();
      const mockQueryBuilder = transactionRepository.createQueryBuilder();

      mockQueryBuilder.getOne = jest.fn().mockResolvedValue(mockTransaction);

      const result = await service.getTransaction(options);

      expect(transactionRepository.createQueryBuilder).toHaveBeenCalledWith('transaction');
      expect(result).toBe(mockTransaction);
    });

    it('should filter by authorization status', async () => {
      const options = { authorizationStatus: true };
      const mockQueryBuilder = transactionRepository.createQueryBuilder();

      mockQueryBuilder.getOne = jest.fn().mockResolvedValue(null);

      await service.getTransaction(options);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.authorizationStatus = :authorizationStatus',
        { authorizationStatus: true }
      );
    });
  });

  describe('createTransaction', () => {
    it('should create transaction successfully', async () => {
      const user = createMockUser();
      const createTransactionDto: CreateTransactionDto = {
        recipientBill: 'recipient-uuid',
        senderBill: 'sender-uuid',
        amountMoney: 100,
        transferTitle: 'Test Transfer',
        locale: 'en' as any,
      };
      const senderBill = createMockBill();
      const recipientBill = createMockBill();
      const mockTransaction = createMockTransaction();

      billService.findBill
        .mockResolvedValueOnce(recipientBill)
        .mockResolvedValueOnce(senderBill);
      validatorService.isCorrectRecipient.mockImplementation(() => true);
      validatorService.isCorrectAmountMoney.mockImplementation(() => true);
      validatorService.isHigherRole.mockReturnValue(false);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);
      jest.spyOn(service, 'sendEmailWithAuthorizationKey' as any).mockResolvedValue(undefined);

      const result = await service.createTransaction(user, createTransactionDto);

      expect(billService.findBill).toHaveBeenCalledTimes(2);
      expect(validatorService.isCorrectRecipient).toHaveBeenCalled();
      expect(validatorService.isCorrectAmountMoney).toHaveBeenCalled();
      expect(transactionRepository.save).toHaveBeenCalledWith(mockTransaction);
      expect(result).toBe(mockTransaction);
    });

    it('should skip email for higher role users', async () => {
      const user = createMockUser();
      const createTransactionDto: CreateTransactionDto = {
        recipientBill: 'recipient-uuid',
        senderBill: 'sender-uuid',
        amountMoney: 100,
        transferTitle: 'Test Transfer',
        locale: 'en' as any,
      };
      const senderBill = createMockBill();
      const recipientBill = createMockBill();
      const mockTransaction = createMockTransaction();

      billService.findBill
        .mockResolvedValueOnce(recipientBill)
        .mockResolvedValueOnce(senderBill);
      validatorService.isCorrectRecipient.mockImplementation(() => true);
      validatorService.isCorrectAmountMoney.mockImplementation(() => true);
      validatorService.isHigherRole.mockReturnValue(true);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const sendEmailSpy = jest.spyOn(service, 'sendEmailWithAuthorizationKey' as any);

      await service.createTransaction(user, createTransactionDto);

      expect(sendEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('confirmTransaction', () => {
    it('should confirm transaction successfully', async () => {
      const user = createMockUser();
      const confirmDto: ConfirmTransactionDto = {
        authorizationKey: 'ABC123',
      };
      const mockBill = createMockBill({ amountMoney: '1000.00' });
      mockBill.senderBill = [createMockTransaction()];

      jest.spyOn(service, '_findTransactionByAuthorizationKey' as any).mockResolvedValue(mockBill);
      jest.spyOn(service, '_updateTransactionAuthorizationStatus' as any).mockResolvedValue({});
      validatorService.isCorrectAmountMoney.mockImplementation(() => true);
      userConfigService.setNotification.mockResolvedValue({} as any);

      await service.confirmTransaction(user, confirmDto);

      expect(validatorService.isCorrectAmountMoney).toHaveBeenCalled();
      expect(userConfigService.setNotification).toHaveBeenCalled();
    });

    it('should throw TransactionNotFoundException when transaction not found', async () => {
      const user = createMockUser();
      const confirmDto: ConfirmTransactionDto = {
        authorizationKey: 'INVALID',
      };

      jest.spyOn(service, '_findTransactionByAuthorizationKey' as any).mockResolvedValue(null);

      await expect(service.confirmTransaction(user, confirmDto)).rejects.toThrow(TransactionNotFoundException);
    });
  });

  describe('getConfirmationDocumentFile', () => {
    it('should generate confirmation document', async () => {
      const user = createMockUser();
      const uuid = 'test-uuid';
      const locale = 'en';
      const mockTransaction = createMockTransaction();

      jest.spyOn(service, 'getTransaction').mockResolvedValue(mockTransaction);
      jest.spyOn(service, '_getConfirmationFileContent' as any).mockResolvedValue('<html>{{date}}</html>');
      jest.spyOn(service, '_getCompiledContent' as any).mockReturnValue('<html>2023-01-01</html>');

      const result = await service.getConfirmationDocumentFile(user, uuid, locale);

      expect(service.getTransaction).toHaveBeenCalledWith({
        user,
        uuid,
        authorizationStatus: true,
      });
      expect(result).toBe('<html>2023-01-01</html>');
    });

    it('should throw TransactionNotFoundException when transaction not found', async () => {
      const user = createMockUser();
      const uuid = 'invalid-uuid';
      const locale = 'en';

      jest.spyOn(service, 'getTransaction').mockResolvedValue(null);

      await expect(service.getConfirmationDocumentFile(user, uuid, locale)).rejects.toThrow(TransactionNotFoundException);
    });
  });

  describe('getReadableStream', () => {
    it('should create readable stream from buffer', () => {
      const buffer = Buffer.from('test data');
      const stream = service.getReadableStream(buffer);

      expect(stream).toBeDefined();
      expect(stream.readable).toBe(true);
    });
  });

  describe('htmlToPdfBuffer', () => {
    it('should convert HTML to PDF buffer', async () => {
      const html = '<html><body>Test</body></html>';
      
      const mockPdf = {
        create: jest.fn().mockReturnValue({
          toBuffer: jest.fn().mockImplementation((callback) => {
            callback(null, Buffer.from('pdf-data'));
          }),
        }),
      };

      jest.doMock('html-pdf', () => mockPdf);

      const result = await service.htmlToPdfBuffer(html);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('_generateAuthrorizationKey', () => {
    it('should generate authorization key', () => {
      const key = service['_generateAuthrorizationKey']();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBe(5);
    });
  });
});
