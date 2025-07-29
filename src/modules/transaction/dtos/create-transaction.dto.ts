import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';
import { Language } from 'common/constants/language.constant';

export class CreateTransactionDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Amount of money to transfer',
    example: 150.50,
    minimum: 0.01
  })
  readonly amountMoney: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Title/description for the transfer',
    example: 'Payment for services',
    maxLength: 255
  })
  readonly transferTitle: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Sender account bill number',
    example: '12345',
    pattern: '^[0-9]{5}$'
  })
  readonly senderBill: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Recipient account bill number',
    example: '67890',
    pattern: '^[0-9]{5}$'
  })
  readonly recipientBill: string;

  @ApiProperty({
    enum: Language,
    description: 'Language for transaction notifications',
    example: Language.EN
  })
  @IsEnum(Language)
  readonly locale: Language;
}
