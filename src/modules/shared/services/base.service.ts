import { IRepository, IPaginationOptions, IPaginationResult } from 'common/types';

export abstract class BaseService<T, CreateDto, UpdateDto> {
  constructor(protected readonly repository: IRepository<T>) {}

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<T | undefined> {
    return this.repository.findOne({ where: { uuid: id } });
  }

  async findWithPagination(options: IPaginationOptions): Promise<IPaginationResult<T>> {
    return (this.repository as any).findWithPagination(options);
  }

  async create(createDto: CreateDto): Promise<T> {
    const entity = this.createEntity(createDto);
    return this.repository.save(entity);
  }

  async update(id: string, updateDto: UpdateDto): Promise<T | undefined> {
    const entity = await this.findOne(id);
    if (!entity) {
      return undefined;
    }
    
    const updatedEntity = this.updateEntity(entity, updateDto);
    return this.repository.save(updatedEntity);
  }

  async remove(id: string): Promise<boolean> {
    const entity = await this.findOne(id);
    if (!entity) {
      return false;
    }
    
    await this.repository.remove(entity);
    return true;
  }

  protected abstract createEntity(createDto: CreateDto): T;
  protected abstract updateEntity(entity: T, updateDto: UpdateDto): T;
}
