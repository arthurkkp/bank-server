import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from 'common/entities';

export class AbstractDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  readonly uuid: string;

  constructor(abstract: AbstractEntity) {
    this.uuid = abstract.uuid;
  }
}
