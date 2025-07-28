import { BlacklistedTokenEntity } from '../entities';
import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

@EntityRepository(BlacklistedTokenEntity)
export class BlacklistedTokenRepository extends Repository<BlacklistedTokenEntity> {}
