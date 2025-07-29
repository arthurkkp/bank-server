import { ApiProperty } from '@nestjs/swagger';
import { UserForgottenPasswordDto } from 'modules/auth/dtos';
import { IsNotEmpty, IsString } from 'class-validator';
import { UserEntity } from 'modules/user/entities';

export class ForgottenPasswordCreateDto {
  @ApiProperty()
  readonly emailAddress: string;

  @ApiProperty()
  readonly locale: string;
  @ApiProperty({ type: () => UserEntity })
  readonly user: UserEntity;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly hashedToken: string;
}
