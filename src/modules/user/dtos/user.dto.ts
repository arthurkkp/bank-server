import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { AbstractDto } from 'common/dtos';
import { UserEntity } from 'modules/user/entities';

import { UserAuthDto } from './user-auth.dto';
import { UserConfigDto } from './user-config.dto';

export class UserDto extends AbstractDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John'
  })
  readonly firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe'
  })
  readonly lastName: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.doe@example.com'
  })
  readonly email?: string;

  @ApiProperty({
    description: 'User avatar filename',
    example: 'default-avatar.png'
  })
  readonly avatar: string;

  @ApiPropertyOptional({ 
    type: UserAuthDto,
    description: 'User authentication information'
  })
  @IsOptional()
  readonly userAuth?: UserAuthDto;

  @ApiPropertyOptional({ 
    type: UserConfigDto,
    description: 'User configuration and preferences'
  })
  @IsOptional()
  readonly userConfig?: UserConfigDto;

  constructor(user: UserEntity) {
    super(user);
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.avatar = user.avatar;
    this.userAuth = user.userAuth?.toDto();
    this.userConfig = user.userConfig?.toDto();
  }
}
