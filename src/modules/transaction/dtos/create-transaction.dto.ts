import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, Min, IsPositive } from 'class-validator';
import { Language } from 'common/constants/language.constant';

export class CreateTransactionDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  @Min(0.01)
  @ApiProperty({
    description: 'Amount of money to transfer (minimum 0.01)',
    example: 100.50,
    minimum: 0.01,
    type: 'number'
  })
  readonly amountMoney: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Title/description for the transfer',
    example: 'Payment for services',
    maxLength: 255,
    type: 'string'
  })
  readonly transferTitle: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Sender account bill number',
    example: '12345678901234567890123456',
    pattern: '^[0-9]{26}$',
    type: 'string'
  })
  readonly senderBill: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Recipient account bill number',
    example: '98765432109876543210987654',
    pattern: '^[0-9]{26}$',
    type: 'string'
  })
  readonly recipientBill: string;

  @ApiProperty({
    description: 'Language for transaction confirmation document',
    enum: Language,
    example: Language.EN,
    type: 'string'
  })
  @IsEnum(Language)
  readonly locale: Language;
}
