import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from 'modules/transaction/controllers';
import { TransactionService } from 'modules/transaction/services';
import { CurrencyModule } from 'modules/currency';
import { BillModule } from 'modules/bill';
import { UserModule } from 'modules/user';
import { LanguageModule } from 'modules/language';
import { TransactionEntity } from 'modules/transaction/entities';
import { BillEntity } from 'modules/bill/entities';
import { CurrencyEntity } from 'modules/currency/entities';

@Module({
  imports: [
    LanguageModule,
    forwardRef(() => UserModule),
    forwardRef(() => CurrencyModule),
    forwardRef(() => BillModule),
    TypeOrmModule.forFeature([
      TransactionEntity,
      BillEntity,
      CurrencyEntity,
    ]),
  ],
  controllers: [TransactionController],
  exports: [TransactionService],
  providers: [TransactionService],
})
export class TransactionModule {}
