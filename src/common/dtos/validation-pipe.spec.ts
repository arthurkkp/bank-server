import { ValidationPipe } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

class TestDto {
  name: string;
  age: number;
  email: string;
  description?: string;
}

describe('ValidationPipe', () => {
  let validationPipe: ValidationPipe;

  beforeEach(() => {
    validationPipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  });

  it('should validate correct data', async () => {
    const validData = {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
    };

    const dto = plainToClass(TestDto, validData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject invalid email', async () => {
    const invalidData = {
      name: 'John Doe',
      age: 30,
      email: 'invalid-email',
    };

    const dto = plainToClass(TestDto, invalidData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should reject missing required fields', async () => {
    const incompleteData = {
      name: 'John Doe',
    };

    const dto = plainToClass(TestDto, incompleteData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept optional fields', async () => {
    const dataWithOptional = {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      description: 'Test description',
    };

    const dto = plainToClass(TestDto, dataWithOptional);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject wrong data types', async () => {
    const wrongTypeData = {
      name: 'John Doe',
      age: 'thirty',
      email: 'john@example.com',
    };

    const dto = plainToClass(TestDto, wrongTypeData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('age');
  });
});
