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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get paginated list of user transactions',
    type: TransactionsPageDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
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
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Transaction created successfully, authorization key sent via email',
    type: CreateTransactionPayloadDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transaction data or insufficient funds',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Sender or recipient account not found',
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
  @ApiNoContentResponse({
    description: 'Transaction confirmed and processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid authorization key or transaction already confirmed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
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
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Get authorization key for transaction confirmation',
    type: TransactionAuthorizationKeyPayloadDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found or not owned by user',
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
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Download transaction confirmation PDF document',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found or not owned by user',
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
