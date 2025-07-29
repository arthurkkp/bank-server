import { CurrencyEntity } from 'modules/currency/entities';
import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class CurrencyRepository extends Repository<CurrencyEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(CurrencyEntity, dataSource.createEntityManager());
  }
}
