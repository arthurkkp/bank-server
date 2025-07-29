import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './services/message.service';
import { MessageController } from './controllers/message.controller';
import { MessageKeyService } from './services/message-key.service';
import { UserModule } from 'modules/user';
import { MessageTemplateService } from './services';
import { LanguageModule } from 'modules/language';
import {
  MessageEntity,
  MessageTemplateEntity,
  MessageKeyEntity,
} from 'modules/message/entities';

@Module({
  imports: [
    LanguageModule,
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([
      MessageEntity,
      MessageTemplateEntity,
      MessageKeyEntity,
    ]),
  ],
  controllers: [MessageController],
  exports: [MessageService, MessageKeyService, MessageTemplateService],
  providers: [MessageService, MessageKeyService, MessageTemplateService],
})
export class MessageModule {}
