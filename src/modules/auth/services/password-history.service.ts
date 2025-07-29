import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordHistoryEntity } from '../entities/password-history.entity';
import { UtilsService } from '../../../utils/services/utils.service';

@Injectable()
export class PasswordHistoryService {
  private readonly maxPasswordHistory = 12;

  constructor(
    @InjectRepository(PasswordHistoryEntity)
    private readonly passwordHistoryRepository: Repository<PasswordHistoryEntity>,
  ) {}

  async addPasswordToHistory(userId: number, passwordHash: string): Promise<void> {
    await this.passwordHistoryRepository.save({
      userId,
      passwordHash,
    });

    const historyCount = await this.passwordHistoryRepository.count({
      where: { userId },
    });

    if (historyCount > this.maxPasswordHistory) {
      const oldestPasswords = await this.passwordHistoryRepository.find({
        where: { userId },
        order: { createdAt: 'ASC' },
        take: historyCount - this.maxPasswordHistory,
      });

      const idsToDelete = oldestPasswords.map(p => p.id);
      await this.passwordHistoryRepository.delete(idsToDelete);
    }
  }

  async isPasswordReused(userId: number, newPassword: string): Promise<boolean> {
    const passwordHistory = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: this.maxPasswordHistory,
    });

    for (const historyEntry of passwordHistory) {
      const isMatch = await UtilsService.validateHash(newPassword, historyEntry.passwordHash);
      if (isMatch) {
        return true;
      }
    }

    return false;
  }

  async getPasswordHistoryCount(userId: number): Promise<number> {
    return this.passwordHistoryRepository.count({
      where: { userId },
    });
  }
}
