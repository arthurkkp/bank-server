import { AbstractEntity } from 'common/entities';
import { BlacklistedTokenDto } from '../dtos';
import { Column, Entity, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'blacklisted_tokens' })
export class BlacklistedTokenEntity extends AbstractEntity<BlacklistedTokenDto> {
  @Column()
  tokenHash: string;

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @CreateDateColumn({
    type: 'timestamp with time zone',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
  })
  updatedAt: Date;

  dtoClass = BlacklistedTokenDto;
}
