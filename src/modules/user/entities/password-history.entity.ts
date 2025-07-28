import { AbstractEntity } from 'common/entities';
import { PasswordHistoryDto } from '../dtos';
import { UserEntity } from './user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'password_history' })
export class PasswordHistoryEntity extends AbstractEntity<PasswordHistoryDto> {
  @Column()
  passwordHash: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  dtoClass = PasswordHistoryDto;
}
