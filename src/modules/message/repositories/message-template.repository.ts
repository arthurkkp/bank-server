import { MessageTemplateEntity } from 'modules/message/entities';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class MessageTemplateRepository extends Repository<MessageTemplateEntity> {
  constructor(private dataSource: DataSource) {
    super(MessageTemplateEntity, dataSource.createEntityManager());
  }
}
