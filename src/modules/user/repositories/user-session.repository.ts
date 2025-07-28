import { UserSessionEntity } from '../entities';
import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

@EntityRepository(UserSessionEntity)
export class UserSessionRepository extends Repository<UserSessionEntity> {}
