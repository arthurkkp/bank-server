export interface IRepository<T> {
  findOne(options: unknown): Promise<T | undefined>;
  find(options?: unknown): Promise<T[]>;
  save(entity: T): Promise<T>;
  remove(entity: T): Promise<T>;
  createQueryBuilder(alias?: string): unknown;
}

export interface IPaginationOptions {
  page: number;
  take: number;
  skip: number;
  order: 'ASC' | 'DESC';
}

export interface IPaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    take: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export type EntityConstructor<T = unknown> = new (...args: unknown[]) => T;

export interface ITypeGuard<T> {
  (value: unknown): value is T;
}
