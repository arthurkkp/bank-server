import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
    type: 'number'
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or validation errors',
    oneOf: [
      { type: 'string', example: 'error.amount_money_not_enough' },
      { type: 'array', items: { type: 'string' }, example: ['error.fields.pinCode'] }
    ]
  })
  message: string | string[];

  @ApiProperty({
    description: 'HTTP error description',
    example: 'Bad Request',
    type: 'string'
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2025-07-29T11:00:43.000Z',
    type: 'string',
    required: false
  })
  timestamp?: string;

  @ApiProperty({
    description: 'Request path that caused the error',
    example: '/bank/transactions/create',
    type: 'string',
    required: false
  })
  path?: string;
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Validation error messages',
    type: 'array',
    items: { type: 'string' },
    example: [
      'error.fields.pinCode',
      'error.fields.password'
    ]
  })
  message: string[];

  @ApiProperty({
    description: 'HTTP status code for validation errors',
    example: 422,
    type: 'number'
  })
  statusCode: 422;
}

export class UnauthorizedErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Unauthorized error message',
    example: 'Unauthorized',
    type: 'string'
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code for unauthorized access',
    example: 401,
    type: 'number'
  })
  statusCode: 401;
}

export class BankingErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Banking-specific error codes',
    enum: [
      'error.amount_money_not_enough',
      'error.account_bill_number_generation_incorrect',
      'error.authorization_key_generation_incorrect',
      'error.foreign_exchange_rates_not_found',
      'error.attempt_make_transfer_to_myself',
      'error.create_failed',
      'error.email_address_exist',
      'error.pin_code_generation_incorrect'
    ],
    example: 'error.amount_money_not_enough'
  })
  message: string;
}
