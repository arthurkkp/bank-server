import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from 'modules/user/dtos';

import { TokenPayloadDto } from './token-payload.dto';

export class LoginPayloadDto {
  @ApiProperty({ 
    type: () => UserDto,
    description: 'Authenticated user information'
  })
  readonly user: UserDto;

  @ApiProperty({ 
    type: () => TokenPayloadDto,
    description: 'JWT token information for API authentication'
  })
  readonly token: TokenPayloadDto;

  constructor(user: UserDto, token: TokenPayloadDto) {
    this.user = user;
    this.token = token;
  }
}
