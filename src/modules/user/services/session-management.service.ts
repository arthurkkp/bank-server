import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEntity, UserSessionEntity } from 'modules/user/entities';
import { UserSessionRepository } from 'modules/user/repositories';
import { UtilsService } from 'utils/services';
import { MoreThan, LessThan } from 'typeorm';

@Injectable()
export class SessionManagementService {
  private readonly MAX_CONCURRENT_SESSIONS = 5;

  constructor(
    private readonly _userSessionRepository: UserSessionRepository,
    private readonly _configService: ConfigService,
  ) {}

  async createSession(
    user: UserEntity,
    deviceInfo: any,
    ipAddress: string,
    userAgent: string,
  ): Promise<UserSessionEntity> {
    const sessionToken = UtilsService.generateRandomString(64);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = this._userSessionRepository.create({
      user,
      sessionToken,
      deviceInfo,
      ipAddress,
      userAgent,
      lastActivity: new Date(),
      expiresAt,
    });

    await this._userSessionRepository.save(session);
    await this._enforceSessionLimit(user);

    return session;
  }

  async updateSessionActivity(sessionToken: string): Promise<void> {
    await this._userSessionRepository.update(
      { sessionToken },
      { lastActivity: new Date() },
    );
  }

  async getUserSessions(user: UserEntity): Promise<UserSessionEntity[]> {
    return this._userSessionRepository.find({
      where: {
        user,
        expiresAt: MoreThan(new Date()),
      },
      order: { lastActivity: 'DESC' },
    });
  }

  async revokeSession(sessionToken: string): Promise<void> {
    await this._userSessionRepository.delete({ sessionToken });
  }

  async revokeAllUserSessions(user: UserEntity, exceptSessionToken?: string): Promise<void> {
    const query = this._userSessionRepository.createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId: user.id });

    if (exceptSessionToken) {
      query.andWhere('session_token != :sessionToken', { sessionToken: exceptSessionToken });
    }

    await query.execute();
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this._userSessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private async _enforceSessionLimit(user: UserEntity): Promise<void> {
    const sessions = await this._userSessionRepository.find({
      where: {
        user,
        expiresAt: MoreThan(new Date()),
      },
      order: { lastActivity: 'DESC' },
    });

    if (sessions.length > this.MAX_CONCURRENT_SESSIONS) {
      const sessionsToDelete = sessions.slice(this.MAX_CONCURRENT_SESSIONS);
      const tokensToDelete = sessionsToDelete.map(s => s.sessionToken);
      await this._userSessionRepository.delete({ sessionToken: tokensToDelete });
    }
  }
}
