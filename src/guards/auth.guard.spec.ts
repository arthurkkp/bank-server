import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { createMockJwtService } from '../test-utils';

describe('AuthGuard', () => {
  let guard: any;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: createMockJwtService(),
        },
      ],
    }).compile();

    guard = module.get(AuthGuard);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid token', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer valid-token',
            },
          }),
        }),
      } as ExecutionContext;

      jwtService.verifyAsync.mockResolvedValue({ uuid: 'user-uuid', role: 'USER' });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    });

    it('should return false for missing token', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return false for invalid token', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid-token',
            },
          }),
        }),
      } as ExecutionContext;

      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });
});
