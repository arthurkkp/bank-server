import { PasswordHistoryEntity } from '../entities';
import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

@EntityRepository(PasswordHistoryEntity)
export class PasswordHistoryRepository extends Repository<PasswordHistoryEntity> {}
