import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UserLoginDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User PIN code for authentication (1-99999)',
    example: 12345,
    minimum: 1,
    maximum: 99999
  })
  readonly pinCode: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8
  })
  readonly password: string;
}
