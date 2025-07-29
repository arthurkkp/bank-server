import { LanguageEntity } from 'modules/language/entities';
import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class LanguageRepository extends Repository<LanguageEntity> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(LanguageEntity, dataSource.createEntityManager());
  }
}
