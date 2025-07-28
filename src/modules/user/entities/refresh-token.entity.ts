import { AbstractEntity } from 'common/entities';
import { RefreshTokenDto } from '../dtos';
import { UserEntity } from './user.entity';
import { Column, Entity, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'refresh_tokens' })
export class RefreshTokenEntity extends AbstractEntity<RefreshTokenDto> {
  @Column()
  tokenHash: string;

  @Column({ type: 'jsonb', nullable: true })
  deviceInfo: any;

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  revokedAt?: Date;

  @CreateDateColumn({
    type: 'timestamp with time zone',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
  })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  dtoClass = RefreshTokenDto;
}
