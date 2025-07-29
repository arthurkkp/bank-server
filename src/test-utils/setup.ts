import 'reflect-metadata';
import { initializeTransactionalContext } from 'typeorm-transactional-cls-hooked';

jest.mock('typeorm-transactional-cls-hooked', () => ({
  initializeTransactionalContext: jest.fn(),
  Transactional: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    return descriptor;
  },
}));

beforeAll(() => {
  initializeTransactionalContext();
});
