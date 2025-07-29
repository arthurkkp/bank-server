import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { DeviceSessionEntity } from '../entities/device-session.entity';
import { SecurityAuditLogEntity, SecurityEventType } from '../entities/security-audit-log.entity';
import { UserTwoFactorEntity } from '../entities/user-two-factor.entity';
import { AccountLockoutEntity } from '../entities/account-lockout.entity';
import { PasswordHistoryEntity } from '../entities/password-history.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { UtilsService } from '../../../utils/services/utils.service';
import { RefreshTokenService } from './refresh-token.service';
import { TwoFactorService } from './two-factor.service';
import { AccountLockoutService } from './account-lockout.service';
import { PasswordHistoryService } from './password-history.service';

@Injectable()
export class AuthSecurityService {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(DeviceSessionEntity)
    private readonly deviceSessionRepository: Repository<DeviceSessionEntity>,
    @InjectRepository(SecurityAuditLogEntity)
    private readonly auditLogRepository: Repository<SecurityAuditLogEntity>,
    @InjectRepository(UserTwoFactorEntity)
    private readonly twoFactorRepository: Repository<UserTwoFactorEntity>,
    @InjectRepository(AccountLockoutEntity)
    private readonly lockoutRepository: Repository<AccountLockoutEntity>,
    @InjectRepository(PasswordHistoryEntity)
    private readonly passwordHistoryRepository: Repository<PasswordHistoryEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly twoFactorService: TwoFactorService,
    private readonly accountLockoutService: AccountLockoutService,
    private readonly passwordHistoryService: PasswordHistoryService,
  ) {}

  async enhancedLogin(
    user: UserEntity,
    ipAddress: string,
    userAgent: string,
    deviceFingerprint: string,
    twoFactorToken?: string
  ): Promise<any> {
    const lockoutStatus = await this.accountLockoutService.isAccountLocked(user.userAuth.id);
    if (lockoutStatus.isLocked) {
      throw new UnauthorizedException(`Account is locked until ${lockoutStatus.lockedUntil}`);
    }

    const isTwoFactorEnabled = await this.twoFactorService.isTwoFactorEnabled(user.userAuth.id);
    
    if (isTwoFactorEnabled) {
      if (!twoFactorToken) {
        return {
          requiresTwoFactor: true,
          message: 'Two-factor authentication required'
        };
      }
      
      const isValidTwoFactor = await this.twoFactorService.verifyToken(user.userAuth.id, twoFactorToken) ||
                               await this.twoFactorService.verifyBackupCode(user.userAuth.id, twoFactorToken);
      
      if (!isValidTwoFactor) {
        await this.auditLogRepository.save({
          eventType: SecurityEventType.LOGIN_FAILED,
          description: 'Invalid two-factor authentication code',
          ipAddress,
          userAgent,
          userId: user.userAuth.id,
        });
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    const payload = { uuid: user.uuid, role: user.userAuth?.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user.userAuth.id,
      deviceFingerprint,
      ipAddress,
      userAgent
    );

    await this.accountLockoutService.resetFailedAttempts(user.userAuth.id);

    const auditLog = new SecurityAuditLogEntity();
    auditLog.eventType = SecurityEventType.LOGIN_SUCCESS;
    auditLog.description = 'User logged in successfully';
    auditLog.ipAddress = ipAddress;
    auditLog.userAgent = userAgent;
    auditLog.userId = user.userAuth.id;
    auditLog.metadata = { 
      deviceFingerprint,
      twoFactorUsed: isTwoFactorEnabled 
    };
    await this.auditLogRepository.save(auditLog);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.userAuth.id,
        uuid: user.uuid,
        requiresTwoFactor: false
      }
    };
  }

  async recordFailedLogin(userId: number, ipAddress: string): Promise<void> {
    await this.accountLockoutService.recordFailedAttempt(userId, ipAddress);
  }

  async refreshTokens(
    refreshToken: string,
    deviceFingerprint: string,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    const tokens = await this.refreshTokenService.rotateRefreshToken(
      refreshToken,
      deviceFingerprint,
      ipAddress,
      userAgent
    );

    if (!tokens) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
    };
  }

  async logout(userId: number, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.refreshTokenService.revokeToken(refreshToken);
    }

    await this.auditLogRepository.save({
      eventType: SecurityEventType.LOGOUT,
      description: 'User logged out',
      userId,
    });
  }

  async logoutAll(userId: number): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);

    await this.auditLogRepository.save({
      eventType: SecurityEventType.LOGOUT,
      description: 'User logged out from all devices',
      userId,
    });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.refreshTokenService.isTokenBlacklisted(token);
  }

  async getUserDeviceSessions(userId: number): Promise<DeviceSessionEntity[]> {
    return this.refreshTokenService.getUserDeviceSessions(userId);
  }

  async revokeDeviceSession(userId: number, sessionId: number): Promise<void> {
    await this.refreshTokenService.revokeDeviceSession(userId, sessionId);
  }
}
