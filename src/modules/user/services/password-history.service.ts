import { Injectable } from '@nestjs/common';
import { PasswordHistoryEntity, UserEntity } from 'modules/user/entities';
import { PasswordHistoryRepository } from 'modules/user/repositories';
import { UtilsService } from 'utils/services';

@Injectable()
export class PasswordHistoryService {
  private readonly PASSWORD_HISTORY_LIMIT = 10;

  constructor(
    private readonly _passwordHistoryRepository: PasswordHistoryRepository,
  ) {}

  async addPasswordToHistory(user: UserEntity, password: string): Promise<void> {
    const passwordHash = UtilsService.generateHash(password);
    
    const passwordHistory = this._passwordHistoryRepository.create({
      user,
      passwordHash,
    });

    await this._passwordHistoryRepository.save(passwordHistory);
    await this._cleanupOldPasswords(user);
  }

  async isPasswordReused(user: UserEntity, password: string): Promise<boolean> {
    const recentPasswords = await this._passwordHistoryRepository.find({
      where: { user },
      order: { createdAt: 'DESC' },
      take: this.PASSWORD_HISTORY_LIMIT,
    });

    for (const passwordHistory of recentPasswords) {
      const isMatch = await UtilsService.validateHash(password, passwordHistory.passwordHash);
      if (isMatch) {
        return true;
      }
    }

    return false;
  }

  private async _cleanupOldPasswords(user: UserEntity): Promise<void> {
    const allPasswords = await this._passwordHistoryRepository.find({
      where: { user },
      order: { createdAt: 'DESC' },
    });

    if (allPasswords.length > this.PASSWORD_HISTORY_LIMIT) {
      const passwordsToDelete = allPasswords.slice(this.PASSWORD_HISTORY_LIMIT);
      const idsToDelete = passwordsToDelete.map(p => p.id);
      await this._passwordHistoryRepository.delete(idsToDelete);
    }
  }
}
