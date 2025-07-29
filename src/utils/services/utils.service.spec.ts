import { Test, TestingModule } from '@nestjs/testing';
import { UtilsService } from './utils.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UtilsService],
    }).compile();

    service = module.get<UtilsService>(UtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateHash', () => {
    it('should generate hash for password', async () => {
      const password = 'password123';
      const hashedPassword = 'hashed-password';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await UtilsService.generateHash(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('validateHash', () => {
    it('should validate password hash', async () => {
      const password = 'password123';
      const hash = 'hashed-password';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await UtilsService.validateHash(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });
  });

  describe('generateRandomString', () => {
    it('should generate random string of specified length', () => {
      const length = 5;
      const result = UtilsService.generateRandomString(length);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
    });
  });

  describe('generateRandomInteger', () => {
    it('should generate random integer within range', () => {
      const min = 10;
      const max = 99;
      const result = UtilsService.generateRandomInteger(min, max);

      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('encodeString', () => {
    it('should encode string to base64', () => {
      const input = 'test-string';
      const result = UtilsService.encodeString(input);

      expect(result).toBe(Buffer.from(input).toString('base64'));
    });
  });
});
