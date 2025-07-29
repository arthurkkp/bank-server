import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { UserTwoFactorEntity } from '../entities/user-two-factor.entity';
import { SecurityAuditLogEntity, SecurityEventType } from '../entities/security-audit-log.entity';
import { UserEntity } from '../../user/entities/user.entity';

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(UserTwoFactorEntity)
    private readonly twoFactorRepository: Repository<UserTwoFactorEntity>,
    @InjectRepository(SecurityAuditLogEntity)
    private readonly auditLogRepository: Repository<SecurityAuditLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async generateSecret(userId: number): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `SmartBank (${user.email})`,
      issuer: 'SmartBank',
      length: 32,
    });

    const backupCodes = this.generateBackupCodes();

    let twoFactor = await this.twoFactorRepository.findOne({ where: { userId } });
    
    if (twoFactor) {
      await this.twoFactorRepository.update(
        { userId },
        {
          secret: secret.base32,
          backupCodes: JSON.stringify(backupCodes),
          recoveryCodesUsed: 0,
        }
      );
    } else {
      await this.twoFactorRepository.save({
        userId,
        secret: secret.base32,
        backupCodes: JSON.stringify(backupCodes),
        isEnabled: false,
      });
    }

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  async enableTwoFactor(userId: number, token: string): Promise<boolean> {
    const twoFactor = await this.twoFactorRepository.findOne({ where: { userId } });
    
    if (!twoFactor) {
      throw new Error('Two-factor authentication not set up');
    }

    const isValid = speakeasy.totp.verify({
      secret: twoFactor.secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (isValid) {
      await this.twoFactorRepository.update(
        { userId },
        { isEnabled: true, lastUsedAt: new Date() }
      );

      const auditLog = new SecurityAuditLogEntity();
      auditLog.eventType = SecurityEventType.TWO_FACTOR_ENABLED;
      auditLog.description = 'Two-factor authentication enabled';
      auditLog.userId = userId;
      auditLog.metadata = {};
      await this.auditLogRepository.save(auditLog);

      return true;
    }

    return false;
  }

  async disableTwoFactor(userId: number, token: string): Promise<boolean> {
    const twoFactor = await this.twoFactorRepository.findOne({ where: { userId } });
    
    if (!twoFactor || !twoFactor.isEnabled) {
      return false;
    }

    const isValid = speakeasy.totp.verify({
      secret: twoFactor.secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (isValid) {
      await this.twoFactorRepository.update(
        { userId },
        { isEnabled: false }
      );

      const auditLog = new SecurityAuditLogEntity();
      auditLog.eventType = SecurityEventType.TWO_FACTOR_DISABLED;
      auditLog.description = 'Two-factor authentication disabled';
      auditLog.userId = userId;
      auditLog.metadata = {};
      await this.auditLogRepository.save(auditLog);

      return true;
    }

    return false;
  }

  async verifyToken(userId: number, token: string): Promise<boolean> {
    const twoFactor = await this.twoFactorRepository.findOne({ where: { userId } });
    
    if (!twoFactor || !twoFactor.isEnabled) {
      return false;
    }

    const isValid = speakeasy.totp.verify({
      secret: twoFactor.secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (isValid) {
      await this.twoFactorRepository.update(
        { userId },
        { lastUsedAt: new Date() }
      );
    }

    return isValid;
  }

  async verifyBackupCode(userId: number, backupCode: string): Promise<boolean> {
    const twoFactor = await this.twoFactorRepository.findOne({ where: { userId } });
    
    if (!twoFactor || !twoFactor.isEnabled || !twoFactor.backupCodes) {
      return false;
    }

    const backupCodes: string[] = JSON.parse(twoFactor.backupCodes);
    const codeIndex = backupCodes.indexOf(backupCode);

    if (codeIndex !== -1) {
      backupCodes.splice(codeIndex, 1);
      
      await this.twoFactorRepository.update(
        { userId },
        {
          backupCodes: JSON.stringify(backupCodes),
          recoveryCodesUsed: twoFactor.recoveryCodesUsed + 1,
          lastUsedAt: new Date(),
        }
      );

      const auditLog = new SecurityAuditLogEntity();
      auditLog.eventType = SecurityEventType.LOGIN_SUCCESS;
      auditLog.description = 'Login with backup code';
      auditLog.userId = userId;
      auditLog.metadata = { method: 'backup_code' };
      await this.auditLogRepository.save(auditLog);

      return true;
    }

    return false;
  }

  async generateNewBackupCodes(userId: number): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    
    await this.twoFactorRepository.update(
      { userId },
      {
        backupCodes: JSON.stringify(backupCodes),
        recoveryCodesUsed: 0,
      }
    );

    return backupCodes;
  }

  async isTwoFactorEnabled(userId: number): Promise<boolean> {
    const twoFactor = await this.twoFactorRepository.findOne({ where: { userId } });
    return twoFactor?.isEnabled || false;
  }

  async getTwoFactorStatus(userId: number): Promise<{
    isEnabled: boolean;
    backupCodesRemaining: number;
    lastUsedAt: Date | null;
  }> {
    const twoFactor = await this.twoFactorRepository.findOne({ where: { userId } });
    
    if (!twoFactor) {
      return {
        isEnabled: false,
        backupCodesRemaining: 0,
        lastUsedAt: null,
      };
    }

    const backupCodes = twoFactor.backupCodes ? JSON.parse(twoFactor.backupCodes) : [];
    
    return {
      isEnabled: twoFactor.isEnabled,
      backupCodesRemaining: backupCodes.length,
      lastUsedAt: twoFactor.lastUsedAt,
    };
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }
    
    return codes;
  }
}
