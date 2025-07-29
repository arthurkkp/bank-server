import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyController } from 'modules/currency/controllers';
import { CurrencyCron } from 'modules/currency/crons';
import { CurrencyService } from 'modules/currency/services';
import { UserModule } from 'modules/user';
import { BillModule } from 'modules/bill';
import { TransactionModule } from 'modules/transaction';
import { CurrencyEntity } from 'modules/currency/entities';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => UserModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => BillModule),
    TypeOrmModule.forFeature([CurrencyEntity]),
  ],
  controllers: [CurrencyController],
  exports: [CurrencyService, CurrencyCron],
  providers: [CurrencyService, CurrencyCron],
})
export class CurrencyModule {}
