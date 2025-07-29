import { MessageKeyEntity } from 'modules/message/entities';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MessageKeyRepository {
  constructor(
    @InjectRepository(MessageKeyEntity)
    private readonly repository: Repository<MessageKeyEntity>,
  ) {}

  async find(options?: any) {
    return this.repository.find(options);
  }

  async findOne(options?: any) {
    return this.repository.findOne(options);
  }

  async save(entity: any) {
    return this.repository.save(entity);
  }

  async remove(entity: any) {
    return this.repository.remove(entity);
  }

  async delete(criteria: any) {
    return this.repository.delete(criteria);
  }

  async update(criteria: any, partialEntity: any) {
    return this.repository.update(criteria, partialEntity);
  }

  async count(options?: any) {
    return this.repository.count(options);
  }

  async createQueryBuilder(alias?: string) {
    return this.repository.createQueryBuilder(alias);
  }
}
