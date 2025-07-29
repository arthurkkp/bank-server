import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { UserEntity } from 'modules/user/entities';

export class ForgottenPasswordCreateDto {
  @ApiProperty({ type: () => UserEntity })
  readonly user: UserEntity;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly hashedToken: string;
}
