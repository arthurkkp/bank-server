import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmTransactionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Authorization key received via email to confirm the transaction',
    example: 'ABC123',
    minLength: 5,
    maxLength: 10
  })
  readonly authorizationKey: string;
}
