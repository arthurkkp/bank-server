import { UserAuthForgottenPasswordEntity } from '../entities';
import { Repository } from 'typeorm';

export class UserAuthForgottenPasswordRepository extends Repository<
  UserAuthForgottenPasswordEntity
> {}
