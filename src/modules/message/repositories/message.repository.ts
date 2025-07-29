import { MessageEntity } from 'modules/message/entities';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class MessageRepository extends Repository<MessageEntity> {
  constructor(private dataSource: DataSource) {
    super(MessageEntity, dataSource.createEntityManager());
  }
}
