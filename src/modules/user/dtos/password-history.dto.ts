import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from 'common/dtos';
import { PasswordHistoryEntity } from '../entities';

export class PasswordHistoryDto extends AbstractDto {
  @ApiProperty()
  passwordHash: string;

  constructor(passwordHistory: PasswordHistoryEntity) {
    super(passwordHistory);
    this.passwordHash = passwordHistory.passwordHash;
  }
}
