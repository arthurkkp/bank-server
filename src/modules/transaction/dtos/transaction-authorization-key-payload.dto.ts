import { ApiProperty } from '@nestjs/swagger';

export class TransactionAuthorizationKeyPayloadDto {
  @ApiProperty({
    description: 'Authorization key required to confirm the transaction',
    example: 'ABC123',
    minLength: 5,
    maxLength: 10
  })
  readonly authorizationKey: string;

  constructor(authorizationKey: string) {
    this.authorizationKey = authorizationKey;
  }
}
