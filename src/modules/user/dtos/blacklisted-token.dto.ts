import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from 'common/dtos';
import { BlacklistedTokenEntity } from '../entities';

export class BlacklistedTokenDto extends AbstractDto {
  @ApiProperty()
  tokenHash: string;

  @ApiProperty()
  expiresAt: Date;

  constructor(blacklistedToken: BlacklistedTokenEntity) {
    super(blacklistedToken);
    this.tokenHash = blacklistedToken.tokenHash;
    this.expiresAt = blacklistedToken.expiresAt;
  }
}
