import { RefreshTokenEntity } from '../entities';
import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

@EntityRepository(RefreshTokenEntity)
export class RefreshTokenRepository extends Repository<RefreshTokenEntity> {}
