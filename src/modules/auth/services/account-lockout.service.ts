import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountLockoutEntity } from '../entities/account-lockout.entity';
import { SecurityAuditLogEntity, SecurityEventType } from '../entities/security-audit-log.entity';

@Injectable()
export class AccountLockoutService {
  private readonly maxFailedAttempts = 5;
  private readonly lockoutDurations = [5, 15, 60, 1440];

  constructor(
    @InjectRepository(AccountLockoutEntity)
    private readonly lockoutRepository: Repository<AccountLockoutEntity>,
    @InjectRepository(SecurityAuditLogEntity)
    private readonly auditLogRepository: Repository<SecurityAuditLogEntity>,
  ) {}

  async recordFailedAttempt(userId: number, ipAddress: string): Promise<void> {
    let lockout = await this.lockoutRepository.findOne({ where: { userId } });

    if (!lockout) {
      lockout = await this.lockoutRepository.save({
        userId,
        failedAttempts: 1,
        lastFailedAttempt: new Date(),
        ipAddress,
      });
    } else {
      const now = new Date();
      const timeSinceLastAttempt = now.getTime() - (lockout.lastFailedAttempt?.getTime() || 0);
      
      if (timeSinceLastAttempt > 15 * 60 * 1000) {
        lockout.failedAttempts = 1;
      } else {
        lockout.failedAttempts += 1;
      }

      lockout.lastFailedAttempt = now;
      lockout.ipAddress = ipAddress;

      if (lockout.failedAttempts >= this.maxFailedAttempts) {
        const lockoutLevel = Math.min(
          Math.floor((lockout.failedAttempts - this.maxFailedAttempts) / this.maxFailedAttempts),
          this.lockoutDurations.length - 1
        );
        
        const lockoutMinutes = this.lockoutDurations[lockoutLevel];
        lockout.lockedUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000);

        const auditLog = new SecurityAuditLogEntity();
        auditLog.eventType = SecurityEventType.ACCOUNT_LOCKED;
        auditLog.description = `Account locked for ${lockoutMinutes} minutes after ${lockout.failedAttempts} failed attempts`;
        auditLog.ipAddress = ipAddress;
        auditLog.userId = userId;
        auditLog.metadata = {
          failedAttempts: lockout.failedAttempts,
          lockoutMinutes,
          lockoutLevel,
        };
        await this.auditLogRepository.save(auditLog);
      }

      await this.lockoutRepository.save(lockout);
    }

    const auditLog = new SecurityAuditLogEntity();
    auditLog.eventType = SecurityEventType.LOGIN_FAILED;
    auditLog.description = 'Failed login attempt';
    auditLog.ipAddress = ipAddress;
    auditLog.userId = userId;
    auditLog.metadata = {
      failedAttempts: lockout.failedAttempts,
      isLocked: lockout.lockedUntil && lockout.lockedUntil > new Date(),
    };
    await this.auditLogRepository.save(auditLog);
  }

  async isAccountLocked(userId: number): Promise<{ isLocked: boolean; lockedUntil?: Date; failedAttempts?: number }> {
    const lockout = await this.lockoutRepository.findOne({ where: { userId } });

    if (!lockout || !lockout.lockedUntil) {
      return { isLocked: false, failedAttempts: lockout?.failedAttempts || 0 };
    }

    const now = new Date();
    
    if (lockout.lockedUntil > now) {
      return {
        isLocked: true,
        lockedUntil: lockout.lockedUntil,
        failedAttempts: lockout.failedAttempts,
      };
    }

    await this.lockoutRepository.update(
      { userId },
      { lockedUntil: null, failedAttempts: 0 }
    );

    const auditLog = new SecurityAuditLogEntity();
    auditLog.eventType = SecurityEventType.ACCOUNT_UNLOCKED;
    auditLog.description = 'Account automatically unlocked after lockout period expired';
    auditLog.userId = userId;
    auditLog.metadata = {};
    await this.auditLogRepository.save(auditLog);

    return { isLocked: false, failedAttempts: 0 };
  }

  async resetFailedAttempts(userId: number): Promise<void> {
    await this.lockoutRepository.update(
      { userId },
      { failedAttempts: 0, lockedUntil: null }
    );
  }

  async unlockAccount(userId: number, adminUserId?: number): Promise<void> {
    await this.lockoutRepository.update(
      { userId },
      { failedAttempts: 0, lockedUntil: null }
    );

    const auditLog = new SecurityAuditLogEntity();
    auditLog.eventType = SecurityEventType.ACCOUNT_UNLOCKED;
    auditLog.description = adminUserId ? 'Account manually unlocked by admin' : 'Account unlocked';
    auditLog.userId = userId;
    auditLog.metadata = { adminUserId };
    await this.auditLogRepository.save(auditLog);
  }

  async getFailedAttempts(userId: number): Promise<number> {
    const lockout = await this.lockoutRepository.findOne({ where: { userId } });
    return lockout?.failedAttempts || 0;
  }
}
