import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TwoFactorSetupDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly token: string;
}

export class TwoFactorVerifyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly token: string;
}
