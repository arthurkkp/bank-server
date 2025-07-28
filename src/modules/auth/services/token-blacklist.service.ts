import { Injectable } from '@nestjs/common';
import { BlacklistedTokenEntity } from 'modules/user/entities';
import { BlacklistedTokenRepository } from 'modules/user/repositories';
import { UtilsService } from 'utils/services';
import { LessThan } from 'typeorm';

@Injectable()
export class TokenBlacklistService {
  constructor(
    private readonly _blacklistedTokenRepository: BlacklistedTokenRepository,
  ) {}

  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    const tokenHash = UtilsService.encodeString(token);
    
    const blacklistedToken = this._blacklistedTokenRepository.create({
      tokenHash,
      expiresAt,
    });

    await this._blacklistedTokenRepository.save(blacklistedToken);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = UtilsService.encodeString(token);
    
    const blacklistedToken = await this._blacklistedTokenRepository.findOne({
      where: { tokenHash },
    });

    return !!blacklistedToken;
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this._blacklistedTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
