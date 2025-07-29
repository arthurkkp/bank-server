import { UserConfigEntity } from '../entities';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class UserConfigRepository extends Repository<UserConfigEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(UserConfigEntity, dataSource.createEntityManager());
  }
}
