import { AbstractEntity } from 'common/entities';
import { PasswordHistoryDto } from '../dtos';
import { UserEntity } from './user.entity';
import { Column, Entity, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'password_history' })
export class PasswordHistoryEntity extends AbstractEntity<PasswordHistoryDto> {
  @Column()
  passwordHash: string;

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

  dtoClass = PasswordHistoryDto;
}
