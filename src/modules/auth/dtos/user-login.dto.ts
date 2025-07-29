import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class UserLoginDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(100000)
  @Max(999999)
  @ApiProperty({
    description: 'User PIN code for authentication (6-digit number)',
    example: 123456,
    minimum: 100000,
    maximum: 999999,
    type: 'number'
  })
  readonly pinCode: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User password for authentication',
    example: 'SecurePassword123!',
    minLength: 8,
    type: 'string'
  })
  readonly password: string;
}
