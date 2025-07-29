import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionPayloadDto {
  @ApiProperty({
    description: 'Unique identifier for the created transaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  readonly uuid: string;

  constructor(uuid: string) {
    this.uuid = uuid;
  }
}
