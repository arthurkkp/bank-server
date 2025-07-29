import { TransactionEntity } from 'modules/transaction/entities';
import { Repository } from 'typeorm';

export class TransactionRepository extends Repository<TransactionEntity> {}
