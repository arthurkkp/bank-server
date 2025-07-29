import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { RoleType } from 'common/constants';
import { AuthUser, Roles } from 'decorators';
import { AuthGuard, RolesGuard } from 'guards';
import { AuthUserInterceptor } from 'interceptors';
import {
  ConfirmTransactionDto,
  CreateTransactionDto,
  CreateTransactionPayloadDto,
  TransactionAuthorizationKeyPayloadDto,
  TransactionsPageDto,
  TransactionsPageOptionsDto,
} from 'modules/transaction/dtos';
import { TransactionService } from 'modules/transaction/services';
import { UserEntity } from 'modules/user/entities';
import { Response } from 'express';
import { ErrorResponseDto, BankingErrorResponseDto } from 'common/dtos';

@Controller('Transactions')
@ApiTags('Transactions')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(AuthUserInterceptor)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly _transactionService: TransactionService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @ApiOperation({
    summary: 'Get user transactions',
    description: 'Retrieve paginated list of user transactions with filtering options',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number (default: 1)',
    example: 1
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: 'number',
    description: 'Number of items per page (default: 10)',
    example: 10
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Transactions retrieved successfully',
    type: TransactionsPageDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
  })
  async getTransactions(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: TransactionsPageOptionsDto,
    @AuthUser() user: UserEntity,
  ): Promise<TransactionsPageDto> {
    return this._transactionService.getTransactions(user, pageOptionsDto);
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @ApiOperation({
    summary: 'Create money transfer',
    description: 'Initiate a new money transfer between accounts with double-entry bookkeeping validation. The transfer requires confirmation with authorization key.',
  })
  @ApiBody({
    type: CreateTransactionDto,
    description: 'Transaction details',
    examples: {
      standardTransfer: {
        summary: 'Standard money transfer',
        value: {
          amountMoney: 100.50,
          transferTitle: 'Payment for services',
          senderBill: '12345678901234567890123456',
          recipientBill: '98765432109876543210987654',
          locale: 'en'
        }
      }
    }
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Transfer created successfully, requires confirmation',
    type: CreateTransactionPayloadDto
  })
  @ApiBadRequestResponse({
    description: 'Transfer validation failed',
    type: BankingErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
  })
  async createTransaction(
    @AuthUser() user: UserEntity,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<CreateTransactionPayloadDto> {
    const { uuid } = await this._transactionService.createTransaction(
      user,
      createTransactionDto,
    );

    return new CreateTransactionPayloadDto(uuid);
  }

  @Patch('confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @ApiOperation({
    summary: 'Confirm money transfer',
    description: 'Confirm and execute a pending money transfer using authorization key. This completes the double-entry bookkeeping transaction.',
  })
  @ApiBody({
    type: ConfirmTransactionDto,
    description: 'Transaction confirmation with authorization key'
  })
  @ApiNoContentResponse({
    description: 'Transfer confirmed and executed successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid authorization key or transaction not found',
    type: BankingErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
  })
  async confirmTransaction(
    @AuthUser() user: UserEntity,
    @Body() confirmTransactionDto: ConfirmTransactionDto,
  ): Promise<void> {
    await this._transactionService.confirmTransaction(
      user,
      confirmTransactionDto,
    );
  }

  @Get('/:uuid/authorizationKey')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @ApiOperation({
    summary: 'Get transaction authorization key',
    description: 'Retrieve the authorization key required to confirm a pending transaction',
  })
  @ApiParam({
    name: 'uuid',
    description: 'Transaction UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string'
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Authorization key retrieved successfully',
    type: TransactionAuthorizationKeyPayloadDto
  })
  @ApiBadRequestResponse({
    description: 'Transaction not found or access denied',
    type: BankingErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
  })
  async getAuthorizationKey(
    @Param('uuid') uuid: string,
    @AuthUser() sender: UserEntity,
  ): Promise<TransactionAuthorizationKeyPayloadDto> {
    const { authorizationKey } = await this._transactionService.getTransaction({
      uuid,
      sender,
    });

    return new TransactionAuthorizationKeyPayloadDto(authorizationKey);
  }

  @Get('/:uuid/:locale/confirmationFile')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @ApiOperation({
    summary: 'Download transaction confirmation PDF',
    description: 'Generate and download a PDF confirmation document for a completed transaction in the specified language',
  })
  @ApiParam({
    name: 'uuid',
    description: 'Transaction UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string'
  })
  @ApiParam({
    name: 'locale',
    description: 'Language code for the confirmation document',
    example: 'en',
    enum: ['en', 'pl'],
    type: 'string'
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'PDF confirmation document generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Transaction not found or access denied',
    type: BankingErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
  })
  async getConfirmation(
    @Param('uuid') uuid: string,
    @Param('locale') locale: string,
    @AuthUser() user: UserEntity,
    @Res() res: Response,
  ): Promise<void> {
    const compiledHtmlContent = await this._transactionService.getConfirmationDocumentFile(
      user,
      uuid,
      locale,
    );
    const buffer = await this._transactionService.htmlToPdfBuffer(
      compiledHtmlContent,
    );
    const stream = this._transactionService.getReadableStream(buffer);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': buffer.length,
    });

    stream.pipe(res);
  }
}
