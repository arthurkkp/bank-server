import { AbstractEntity } from 'common/entities';
import { UserSessionDto } from '../dtos';
import { UserEntity } from './user.entity';
import { Column, Entity, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'user_sessions' })
export class UserSessionEntity extends AbstractEntity<UserSessionDto> {
  @Column()
  sessionToken: string;

  @Column({ type: 'jsonb', nullable: true })
  deviceInfo: any;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp with time zone' })
  lastActivity: Date;

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

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  dtoClass = UserSessionDto;
}
