import { ITypeGuard } from 'common/types';

enum RoleType {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ROOT = 'ROOT',
}

export const isString: ITypeGuard<string> = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber: ITypeGuard<number> = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isPositiveNumber: ITypeGuard<number> = (value: unknown): value is number => {
  return isNumber(value) && (value as number) > 0;
};

export const isValidEmail: ITypeGuard<string> = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value as string);
};

export const isValidUuid: ITypeGuard<string> = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value as string);
};

export const isRoleType: ITypeGuard<RoleType> = (value: unknown): value is RoleType => {
  return Object.values(RoleType).includes(value as RoleType);
};

export const isValidCurrency: ITypeGuard<string> = (value: unknown): value is string => {
  if (!isString(value)) return false;
  return /^[A-Z]{3}$/.test(value as string);
};

export const isValidAmount: ITypeGuard<number> = (value: unknown): value is number => {
  return isNumber(value) && (value as number) >= 0 && Number.isFinite(value as number);
};
