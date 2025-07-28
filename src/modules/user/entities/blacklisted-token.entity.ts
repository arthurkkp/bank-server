import { AbstractEntity } from 'common/entities';
import { BlacklistedTokenDto } from '../dtos';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'blacklisted_tokens' })
export class BlacklistedTokenEntity extends AbstractEntity<BlacklistedTokenDto> {
  @Column()
  tokenHash: string;

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  dtoClass = BlacklistedTokenDto;
}
