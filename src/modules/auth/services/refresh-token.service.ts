import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { DeviceSessionEntity } from '../entities/device-session.entity';
import { SecurityAuditLogEntity, SecurityEventType } from '../entities/security-audit-log.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(DeviceSessionEntity)
    private readonly deviceSessionRepository: Repository<DeviceSessionEntity>,
    @InjectRepository(SecurityAuditLogEntity)
    private readonly auditLogRepository: Repository<SecurityAuditLogEntity>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async generateRefreshToken(
    userId: number,
    deviceFingerprint: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.save({
      token,
      userId,
      deviceFingerprint,
      ipAddress,
      userAgent,
      expiresAt,
    });

    await this.updateDeviceSession(userId, deviceFingerprint, ipAddress, userAgent);

    const auditLog = new SecurityAuditLogEntity();
    auditLog.eventType = SecurityEventType.TOKEN_REFRESHED;
    auditLog.description = 'Refresh token generated';
    auditLog.ipAddress = ipAddress;
    auditLog.userAgent = userAgent;
    auditLog.userId = userId;
    auditLog.metadata = { deviceFingerprint };
    await this.auditLogRepository.save(auditLog);

    return token;
  }

  async rotateRefreshToken(
    oldToken: string,
    deviceFingerprint: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const existingToken = await this.refreshTokenRepository.findOne({
      where: { token: oldToken, isRevoked: false },
    });

    if (!existingToken || existingToken.expiresAt < new Date()) {
      return null;
    }

    await this.refreshTokenRepository.update(
      { token: oldToken },
      { isRevoked: true }
    );

    const newRefreshToken = await this.generateRefreshToken(
      existingToken.userId,
      deviceFingerprint,
      ipAddress,
      userAgent,
    );

    const payload = { sub: existingToken.userId };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async revokeToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token },
      { isRevoked: true }
    );
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );

    await this.deviceSessionRepository.update(
      { userId, isActive: true },
      { isActive: false }
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });

    return refreshToken?.isRevoked || false;
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private async updateDeviceSession(
    userId: number,
    deviceFingerprint: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const existingSession = await this.deviceSessionRepository.findOne({
      where: { userId, deviceFingerprint },
    });

    if (existingSession) {
      await this.deviceSessionRepository.update(
        { id: existingSession.id },
        {
          lastActivity: new Date(),
          ipAddress,
          userAgent,
          isActive: true,
        }
      );
    } else {
      const activeSessions = await this.deviceSessionRepository.count({
        where: { userId, isActive: true },
      });

      if (activeSessions >= 5) {
        const oldestSession = await this.deviceSessionRepository.findOne({
          where: { userId, isActive: true },
          order: { lastActivity: 'ASC' },
        });

        if (oldestSession) {
          await this.deviceSessionRepository.update(
            { id: oldestSession.id },
            { isActive: false }
          );

          await this.refreshTokenRepository.update(
            { userId, deviceFingerprint: oldestSession.deviceFingerprint },
            { isRevoked: true }
          );
        }
      }

      await this.deviceSessionRepository.save({
        userId,
        deviceFingerprint,
        ipAddress,
        userAgent,
        deviceName: this.extractDeviceName(userAgent),
      });
    }
  }

  private extractDeviceName(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';
    
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux PC';
    
    return 'Unknown Device';
  }

  async getUserDeviceSessions(userId: number): Promise<DeviceSessionEntity[]> {
    return this.deviceSessionRepository.find({
      where: { userId, isActive: true },
      order: { lastActivity: 'DESC' },
    });
  }

  async revokeDeviceSession(userId: number, sessionId: number): Promise<void> {
    const session = await this.deviceSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (session) {
      await this.deviceSessionRepository.update(
        { id: sessionId },
        { isActive: false }
      );

      await this.refreshTokenRepository.update(
        { userId, deviceFingerprint: session.deviceFingerprint },
        { isRevoked: true }
      );
    }
  }
}
