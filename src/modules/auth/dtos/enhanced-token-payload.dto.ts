import { ApiProperty } from '@nestjs/swagger';

export class EnhancedTokenPayloadDto {
  @ApiProperty()
  readonly accessToken: string;

  @ApiProperty()
  readonly refreshToken: string;

  @ApiProperty()
  readonly expiresIn: number;

  @ApiProperty()
  readonly refreshExpiresIn: number;

  constructor(data: { accessToken: string; refreshToken: string; expiresIn: number; refreshExpiresIn: number }) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.expiresIn = data.expiresIn;
    this.refreshExpiresIn = data.refreshExpiresIn;
  }
}
