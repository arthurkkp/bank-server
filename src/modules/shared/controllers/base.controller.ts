import { IPaginationOptions, IPaginationResult } from 'common/types';
import { BaseService } from '../services/base.service';

export abstract class BaseController<T, CreateDto, UpdateDto> {
  constructor(protected readonly service: BaseService<T, CreateDto, UpdateDto>) {}

  async findAll(): Promise<T[]> {
    return this.service.findAll();
  }

  async findOne(id: string): Promise<T | undefined> {
    return this.service.findOne(id);
  }

  async findWithPagination(options: IPaginationOptions): Promise<IPaginationResult<T>> {
    return this.service.findWithPagination(options);
  }

  async create(createDto: CreateDto): Promise<T> {
    return this.service.create(createDto);
  }

  async update(id: string, updateDto: UpdateDto): Promise<T | undefined> {
    return this.service.update(id, updateDto);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const success = await this.service.remove(id);
    return { success };
  }
}
