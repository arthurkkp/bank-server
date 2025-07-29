import { Repository, SelectQueryBuilder } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export const createMockRepository = (): any => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
    execute: jest.fn(),
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  })),
});

export const createMockMailerService = (): Partial<MailerService> => ({
  sendMail: jest.fn().mockResolvedValue({ accepted: ['test@example.com'] }),
});

export const createMockConfigService = (): Partial<ConfigService> => ({
  get: jest.fn((key: string) => {
    const config = {
      JWT_EXPIRATION_TIME: '3600',
      JWT_FORGOTTEN_PASSWORD_TOKEN_SECRET: 'test-secret',
      JWT_FORGOTTEN_PASSWORD_TOKEN_EXPIRATION_TIME: '1800',
      EMAIL_ADDRESS: 'test@bank.com',
    };
    return config[key];
  }),
});

export const createMockJwtService = (): Partial<JwtService> => ({
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  verifyAsync: jest.fn().mockResolvedValue({ uuid: 'test-uuid', role: 'USER' }),
});

export const createMockUtilsService = () => ({
  generateHash: jest.fn().mockResolvedValue('hashed-password'),
  validateHash: jest.fn().mockResolvedValue(true),
  generateRandomString: jest.fn().mockReturnValue('random-string'),
  generateRandomInteger: jest.fn().mockReturnValue(12345),
});
