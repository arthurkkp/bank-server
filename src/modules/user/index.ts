import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'modules/auth';
import { UserController } from 'modules/user/controllers';
import {
  UserAuthForgottenPasswordService,
  UserAuthService,
  UserConfigService,
  UserService,
} from 'modules/user/services';
import { BillModule } from 'modules/bill';
import { CurrencyModule } from 'modules/currency';
import { MessageModule } from 'modules/message';
import { TransactionModule } from 'modules/transaction';
import { 
  UserEntity,
  UserAuthEntity,
  UserConfigEntity,
  UserAuthForgottenPasswordEntity 
} from './entities';
import { BillEntity } from 'modules/bill/entities';
import { CurrencyEntity } from 'modules/currency/entities';
import { TransactionEntity } from 'modules/transaction/entities';

@Module({
  imports: [
    forwardRef(() => MessageModule),
    forwardRef(() => CurrencyModule),
    forwardRef(() => BillModule),
    forwardRef(() => AuthModule),
    forwardRef(() => TransactionModule),
    TypeOrmModule.forFeature([
      UserEntity,
      UserAuthEntity,
      UserConfigEntity,
      UserAuthForgottenPasswordEntity,
      BillEntity,
      CurrencyEntity,
      TransactionEntity,
    ]),
  ],
  controllers: [UserController],
  exports: [
    UserAuthService,
    UserConfigService,
    UserService,
    UserAuthForgottenPasswordService,
  ],
  providers: [
    UserAuthService,
    UserConfigService,
    UserService,
    UserAuthForgottenPasswordService,
  ],
})
export class UserModule {}
