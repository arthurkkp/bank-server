import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from 'modules/user/dtos';

import { TokenPayloadDto } from './token-payload.dto';

export class LoginPayloadDto {
  @ApiProperty({ 
    type: () => UserDto,
    description: 'Authenticated user information',
    example: {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    }
  })
  readonly user: UserDto;

  @ApiProperty({ 
    type: () => TokenPayloadDto,
    description: 'JWT token information for API authentication',
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTM3ODY4NDMsImV4cCI6MTc1Mzc5MDQ0M30.example',
      expiresIn: 3600
    }
  })
  readonly token: TokenPayloadDto;

  constructor(user: UserDto, token: TokenPayloadDto) {
    this.user = user;
    this.token = token;
  }
}
