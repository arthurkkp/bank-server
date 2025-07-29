import { IPaginationOptions, IPaginationResult } from 'common/types';

export abstract class BaseRepository<T> {
  
  async findOneByUuid(uuid: string): Promise<T | undefined> {
    return (this as any).findOne({ where: { uuid } });
  }

  async findWithPagination(
    options: IPaginationOptions,
    queryBuilder?: any
  ): Promise<IPaginationResult<T>> {
    const qb = queryBuilder ?? (this as any).createQueryBuilder();
    
    const [data, itemCount] = await qb
      .skip(options.skip)
      .take(options.take)
      .getManyAndCount();

    const pageCount = Math.ceil(itemCount / options.take);
    
    return {
      data,
      meta: {
        page: options.page,
        take: options.take,
        itemCount,
        pageCount,
        hasPreviousPage: options.page > 1,
        hasNextPage: options.page < pageCount,
      },
    };
  }

  createTypedQueryBuilder(alias?: string): any {
    return (this as any).createQueryBuilder(alias);
  }
}
