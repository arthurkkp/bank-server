import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { AbstractDto } from 'common/dtos';
import { BillEntity } from 'modules/bill/entities';
import { CurrencyDto } from 'modules/currency/dtos';
import { UserDto } from 'modules/user/dtos';

export class BillDto extends AbstractDto {
  @ApiProperty({
    description: 'Unique 5-digit account bill number',
    example: '12345',
    pattern: '^[0-9]{5}$'
  })
  readonly accountBillNumber: string;

  @ApiPropertyOptional({
    description: 'Current account balance in the account currency',
    example: '1250.75'
  })
  @IsOptional()
  readonly amountMoney?: string;

  @ApiProperty({ 
    type: () => CurrencyDto,
    description: 'Currency information for this account'
  })
  readonly currency: CurrencyDto;

  @ApiPropertyOptional({ 
    type: () => UserDto,
    description: 'Account owner information'
  })
  @IsOptional()
  readonly user?: UserDto;

  constructor(bill: BillEntity) {
    super(bill);
    this.amountMoney = bill.amountMoney;
    this.accountBillNumber = bill.accountBillNumber;
    this.currency = bill.currency.toDto();
    this.user = bill.user?.toDto();
  }
}
