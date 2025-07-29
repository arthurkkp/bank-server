import { AbstractDto } from '../dtos';
import { UtilsService } from '../../utils/services';

export abstract class AbstractEntity<T extends AbstractDto = AbstractDto> {
  id!: number;
  uuid!: string;

  abstract dtoClass: new (entity: AbstractEntity<T>, options?: unknown) => T;

  toDto(options?: unknown): T {
    return UtilsService.toDto(this.dtoClass, this, options);
  }
}
