import { ApiProperty } from '@nestjs/swagger';

export class TokenPayloadDto {
  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600
  })
  readonly expiresIn: number;

  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  readonly accessToken: string;

  constructor(data: { expiresIn: number; accessToken: string }) {
    this.expiresIn = data.expiresIn;
    this.accessToken = data.accessToken;
  }
}
