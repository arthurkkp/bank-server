import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from 'common/dtos';
import { RefreshTokenEntity } from '../entities';

export class RefreshTokenDto extends AbstractDto {
  @ApiProperty()
  tokenHash: string;

  @ApiProperty()
  deviceInfo: any;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  revokedAt?: Date;

  constructor(refreshToken: RefreshTokenEntity) {
    super(refreshToken);
    this.tokenHash = refreshToken.tokenHash;
    this.deviceInfo = refreshToken.deviceInfo;
    this.expiresAt = refreshToken.expiresAt;
    this.revokedAt = refreshToken.revokedAt;
  }
}
