import { ApiProperty } from '@nestjs/swagger';

export class TokenPayloadDto {
  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
    type: 'number'
  })
  readonly expiresIn: number;

  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTM3ODY4NDMsImV4cCI6MTc1Mzc5MDQ0M30.example',
    type: 'string'
  })
  readonly accessToken: string;

  constructor(data: { expiresIn: number; accessToken: string }) {
    this.expiresIn = data.expiresIn;
    this.accessToken = data.accessToken;
  }
}
