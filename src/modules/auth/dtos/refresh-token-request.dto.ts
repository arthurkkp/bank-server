import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly refreshToken: string;
}
