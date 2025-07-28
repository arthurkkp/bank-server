import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenEntity, UserEntity } from 'modules/user/entities';
import { RefreshTokenRepository } from 'modules/user/repositories';
import { UtilsService } from 'utils/services';
import { MoreThan, LessThan } from 'typeorm';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly _refreshTokenRepository: RefreshTokenRepository,
    private readonly _configService: ConfigService,
  ) {}

  async createRefreshToken(
    user: UserEntity,
    deviceInfo?: any,
  ): Promise<{ token: string; entity: RefreshTokenEntity }> {
    const token = UtilsService.generateRandomString(64);
    const tokenHash = UtilsService.encodeString(token);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const refreshTokenEntity = this._refreshTokenRepository.create({
      tokenHash,
      user,
      deviceInfo,
      expiresAt,
    });

    await this._refreshTokenRepository.save(refreshTokenEntity);

    return { token, entity: refreshTokenEntity };
  }

  async validateRefreshToken(token: string): Promise<RefreshTokenEntity | null> {
    const tokenHash = UtilsService.encodeString(token);
    
    const refreshToken = await this._refreshTokenRepository.findOne({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user', 'user.userAuth'],
    });

    return refreshToken || null;
  }

  async revokeRefreshToken(refreshToken: RefreshTokenEntity): Promise<void> {
    refreshToken.revokedAt = new Date();
    await this._refreshTokenRepository.save(refreshToken);
  }

  async revokeAllUserRefreshTokens(user: UserEntity): Promise<void> {
    await this._refreshTokenRepository.update(
      { user, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  async rotateRefreshToken(
    oldRefreshToken: RefreshTokenEntity,
    deviceInfo?: any,
  ): Promise<{ token: string; entity: RefreshTokenEntity }> {
    await this.revokeRefreshToken(oldRefreshToken);
    return this.createRefreshToken(oldRefreshToken.user, deviceInfo);
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this._refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
