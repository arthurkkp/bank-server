import { AbstractDto } from 'common/dtos';
import { UserAuthDto } from './user-auth.dto';
import { UserConfigDto } from './user-config.dto';

export class UserDto extends AbstractDto {
  readonly firstName!: string;
  readonly lastName!: string;
  readonly email?: string;
  readonly avatar!: string;
  readonly userAuth?: UserAuthDto;
  readonly userConfig?: UserConfigDto;

  constructor(user: any) {
    super(user);
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.avatar = user.avatar || '';
    this.userAuth = user.userAuth?.toDto();
    this.userConfig = user.userConfig?.toDto();
  }
}
