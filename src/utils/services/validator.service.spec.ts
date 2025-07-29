import { Test, TestingModule } from '@nestjs/testing';
import { ValidatorService } from './validator.service';
import { RoleType } from '../../common/constants';
import { HttpException } from '@nestjs/common';

describe('ValidatorService', () => {
  let service: ValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidatorService],
    }).compile();

    service = module.get<ValidatorService>(ValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isCorrectRecipient', () => {
    it('should not throw for different bill IDs', () => {
      expect(() => service.isCorrectRecipient(1, 2)).not.toThrow();
    });

    it('should throw exception for same bill IDs', () => {
      expect(() => service.isCorrectRecipient(1, 1)).toThrow();
    });

    it('should throw exception for undefined recipient', () => {
      expect(() => service.isCorrectRecipient(1, null as any)).toThrow();
    });
  });

  describe('isCorrectAmountMoney', () => {
    it('should not throw for sufficient funds', () => {
      expect(() => service.isCorrectAmountMoney(RoleType.USER, '1000.00', 500)).not.toThrow();
    });

    it('should throw exception for insufficient funds', () => {
      expect(() => service.isCorrectAmountMoney(RoleType.USER, '100.00', 500)).toThrow();
    });

    it('should throw exception for zero amount', () => {
      expect(() => service.isCorrectAmountMoney(RoleType.USER, '1000.00', 0)).toThrow();
    });

    it('should throw exception for negative amount', () => {
      expect(() => service.isCorrectAmountMoney(RoleType.USER, '1000.00', -100)).toThrow();
    });

    it('should allow higher roles to bypass balance check', () => {
      expect(() => service.isCorrectAmountMoney(RoleType.ADMIN, '100.00', 500)).not.toThrow();
    });
  });

  describe('isHigherRole', () => {
    it('should return false for USER role', () => {
      expect(service.isHigherRole(RoleType.USER)).toBe(false);
    });

    it('should return true for ADMIN role', () => {
      expect(service.isHigherRole(RoleType.ADMIN)).toBe(true);
    });

    it('should return true for ROOT role', () => {
      expect(service.isHigherRole(RoleType.ROOT)).toBe(true);
    });
  });
});
