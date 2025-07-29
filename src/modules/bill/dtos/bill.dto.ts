import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { AbstractDto } from 'common/dtos';
import { BillEntity } from 'modules/bill/entities';
import { CurrencyDto } from 'modules/currency/dtos';
import { UserDto } from 'modules/user/dtos';

export class BillDto extends AbstractDto {
  @ApiProperty({
    description: 'Unique 26-digit account bill number',
    example: '12345678901234567890123456',
    pattern: '^[0-9]{26}$',
    type: 'string'
  })
  readonly accountBillNumber: string;

  @ApiPropertyOptional({
    description: 'Current account balance (optional for security)',
    example: '1250.75',
    type: 'string'
  })
  @IsOptional()
  readonly amountMoney?: string;

  @ApiProperty({ 
    type: () => CurrencyDto,
    description: 'Account currency information',
    example: {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      name: 'US Dollar',
      code: 'USD',
      symbol: '$'
    }
  })
  readonly currency: CurrencyDto;

  @ApiPropertyOptional({ 
    type: () => UserDto,
    description: 'Account owner information (optional for privacy)',
    example: {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    }
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
