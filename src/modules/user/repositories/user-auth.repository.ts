import { UserAuthEntity } from '../entities';
import { Repository } from 'typeorm';

export class UserAuthRepository extends Repository<UserAuthEntity> {}
