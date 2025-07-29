import { BillEntity } from 'modules/bill/entities';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BillRepository extends Repository<BillEntity> {}
