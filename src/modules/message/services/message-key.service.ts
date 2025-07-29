import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, InsertResult } from 'typeorm';
import { MessageKeyEntity } from '../entities';

@Injectable()
export class MessageKeyService {
  private readonly _messageKeys = [{ name: 'WELCOME_MESSAGE' }];

  constructor(
    @InjectRepository(MessageKeyEntity)
    private readonly _messageKeyRepository: Repository<MessageKeyEntity>,
  ) {}

  public async getMessageKey(
    options: Partial<{
      uuid: string;
      name: string;
    }>,
  ): Promise<MessageKeyEntity | undefined> {
    const queryBuilder = this._messageKeyRepository.createQueryBuilder(
      'messageKey',
    );

    if (options.uuid) {
      queryBuilder.orWhere('messageKey.uuid = :uuid', { uuid: options.uuid });
    }

    if (options.name) {
      queryBuilder.orWhere('messageKey.name = :name', { name: options.name });
    }

    return queryBuilder.getOne();
  }

  public async setMessageKeys(): Promise<void> {
    const messageKeys = await this._getMessageKeys();

    for (const { name } of this._messageKeys) {
      if (messageKeys.find((messageKey) => messageKey.name === name)) {
        continue;
      }

      await this._createMessageKeys(name);
    }
  }

  private async _createMessageKeys(name: string): Promise<InsertResult> {
    const queryBuilder = this._messageKeyRepository.createQueryBuilder(
      'messageKey',
    );

    return queryBuilder.insert().values({ name }).execute();
  }

  private async _getMessageKeys(): Promise<MessageKeyEntity[] | undefined> {
    const queryBuilder = this._messageKeyRepository.createQueryBuilder(
      'messageKey',
    );

    return queryBuilder.getMany();
  }
}
