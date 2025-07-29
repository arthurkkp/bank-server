import { RoleType } from '../common/constants';
import { BillEntity } from '../modules/bill/entities';
import { CurrencyEntity } from '../modules/currency/entities';
import { TransactionEntity } from '../modules/transaction/entities';
import { UserEntity, UserAuthEntity, UserConfigEntity } from '../modules/user/entities';

export const createMockUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 1,
  uuid: 'user-uuid-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  userAuth: createMockUserAuth(),
  userConfig: createMockUserConfig(),
  bills: [],
  toDto: jest.fn().mockReturnValue({}),
  ...overrides,
} as UserEntity);

export const createMockUserAuth = (overrides: Partial<UserAuthEntity> = {}): UserAuthEntity => ({
  id: 1,
  uuid: 'auth-uuid-123',
  pinCode: 12345,
  password: 'hashed-password',
  role: RoleType.USER,
  lastLoggedDate: new Date(),
  lastLogoutDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  user: null,
  toDto: jest.fn().mockReturnValue({}),
  ...overrides,
} as UserAuthEntity);

export const createMockUserConfig = (overrides: Partial<UserConfigEntity> = {}): UserConfigEntity => ({
  id: 1,
  uuid: 'config-uuid-123',
  notificationCount: 0,
  lastPresentLoggedDate: new Date(),
  lastSuccessfullyLoggedDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  user: null,
  currency: createMockCurrency(),
  toDto: jest.fn().mockReturnValue({}),
  ...overrides,
} as UserConfigEntity);

export const createMockCurrency = (overrides: Partial<CurrencyEntity> = {}): CurrencyEntity => ({
  id: 1,
  uuid: 'currency-uuid-123',
  name: 'USD',
  currentExchangeRate: 1.0,
  base: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  bills: [],
  usersConfig: [],
  toDto: jest.fn().mockReturnValue({}),
  ...overrides,
} as CurrencyEntity);

export const createMockBill = (overrides: Partial<BillEntity> = {}): BillEntity => ({
  id: 1,
  uuid: 'bill-uuid-123',
  accountBillNumber: '1234567890123456789012345',
  amountMoney: '1000.00',
  createdAt: new Date(),
  updatedAt: new Date(),
  user: createMockUser(),
  currency: createMockCurrency(),
  recipientBill: [],
  senderBill: [],
  toDto: jest.fn().mockReturnValue({}),
  ...overrides,
} as BillEntity);

export const createMockTransaction = (overrides: Partial<TransactionEntity> = {}): TransactionEntity => ({
  id: 1,
  uuid: 'transaction-uuid-123',
  amountMoney: 100.00,
  transferTitle: 'Test Transfer',
  authorizationKey: 'ABC123',
  authorizationStatus: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  senderBill: createMockBill(),
  recipientBill: createMockBill(),
  toDto: jest.fn().mockReturnValue({}),
  ...overrides,
} as TransactionEntity);
