import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBillDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Currency code for the new account',
    example: 'USD',
    enum: ['USD', 'EUR', 'PLN', 'GBP'],
    pattern: '^[A-Z]{3}$'
  })
  readonly currency: string;
}
