import { UserEntity } from '../entities';
import { BaseRepository } from 'common/repositories/base.repository';

export class UserRepository extends BaseRepository<UserEntity> {
  async findByEmail(email: string): Promise<UserEntity | undefined> {
    return (this as any).findOne({ where: { email } });
  }

  async findByEmailWithAuth(email: string): Promise<UserEntity | undefined> {
    return (this as any).findOne({
      where: { email },
      relations: ['userAuth', 'userConfig'],
    });
  }

  async findActiveUsers(): Promise<UserEntity[]> {
    return this.createTypedQueryBuilder('user')
      .leftJoinAndSelect('user.userAuth', 'userAuth')
      .where('userAuth.isActive = :isActive', { isActive: true })
      .getMany();
  }
}
