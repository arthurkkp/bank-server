import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UserRegisterDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 1
  })
  readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 1
  })
  readonly lastName: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    format: 'email'
  })
  readonly email: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ 
    description: 'User password (minimum 6 characters)',
    example: 'SecurePassword123!',
    minLength: 6 
  })
  readonly password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Currency code for the initial account',
    example: 'USD',
    enum: ['USD', 'EUR', 'PLN', 'GBP'],
    pattern: '^[A-Z]{3}$'
  })
  readonly currency: string;
}
