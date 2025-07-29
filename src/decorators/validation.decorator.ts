import { ITypeGuard } from 'common/types';

export function ValidateWith<T>(guard: ITypeGuard<T>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      for (const arg of args) {
        if (!guard(arg)) {
          throw new Error(`Validation failed for ${propertyKey}`);
        }
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function ValidateEmail() {
  return ValidateWith((value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  });
}

export function ValidateUuid() {
  return ValidateWith((value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  });
}

export function ValidatePositiveNumber() {
  return ValidateWith((value: unknown): value is number => {
    return typeof value === 'number' && value > 0 && Number.isFinite(value);
  });
}
