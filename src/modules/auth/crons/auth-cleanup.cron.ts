import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshTokenService } from '../services/refresh-token.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { SessionManagementService } from 'modules/user/services/session-management.service';

@Injectable()
export class AuthCleanupCron {
  private readonly _logger = new Logger(AuthCleanupCron.name);

  constructor(
    private readonly _refreshTokenService: RefreshTokenService,
    private readonly _tokenBlacklistService: TokenBlacklistService,
    private readonly _sessionManagementService: SessionManagementService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  public async cleanupExpiredTokensAndSessions(): Promise<void> {
    try {
      await Promise.all([
        this._refreshTokenService.cleanupExpiredTokens(),
        this._tokenBlacklistService.cleanupExpiredTokens(),
        this._sessionManagementService.cleanupExpiredSessions(),
      ]);

      this._logger.log('Successfully cleaned up expired tokens and sessions');
    } catch (error) {
      this._logger.error('Failed to cleanup expired tokens and sessions', error);
    }
  }
}
