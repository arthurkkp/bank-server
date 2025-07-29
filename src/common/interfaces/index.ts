export interface IService {
  [key: string]: any;
}

export interface IController {
  [key: string]: any;
}

export interface IEntity {
  id: number;
  uuid: string;
  toDto(options?: unknown): any;
}

export interface IDto {
  uuid: string;
}

export interface IValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface IApiResponse<T = any> {
  data: T;
  message?: string;
  statusCode: number;
}

export interface IPaginatedResponse<T = any> extends IApiResponse<T[]> {
  meta: {
    page: number;
    take: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}
