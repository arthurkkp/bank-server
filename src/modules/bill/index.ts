import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillController } from 'modules/bill/controllers';
import { BillService } from 'modules/bill/services';
import { CurrencyModule } from 'modules/currency';
import { BillSubscriber } from './subscribers';
import { MessageModule } from 'modules/message';
import { UserModule } from 'modules/user';
import { LanguageModule } from 'modules/language';
import { TransactionModule } from 'modules/transaction';
import { BillEntity } from 'modules/bill/entities';
import { CurrencyEntity } from 'modules/currency/entities';
import { TransactionEntity } from 'modules/transaction/entities';

@Module({
  imports: [
    MessageModule,
    LanguageModule,
    forwardRef(() => TransactionModule),
    forwardRef(() => UserModule),
    forwardRef(() => CurrencyModule),
    TypeOrmModule.forFeature([
      BillEntity,
      CurrencyEntity,
      TransactionEntity,
    ]),
  ],
  controllers: [BillController],
  exports: [BillService],
  providers: [BillService, BillSubscriber],
})
export class BillModule {}
