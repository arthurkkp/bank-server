import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiResponse,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiQuery
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthUser, Roles } from 'decorators';
import { UserEntity } from 'modules/user/entities';
import { AuthGuard, RolesGuard } from 'guards';
import { AuthUserInterceptor } from 'interceptors';
import { RoleType } from 'common/constants';
import { TransactionService } from 'modules/transaction/services';
import {
  TransactionsPageDto,
  TransactionsPageOptionsDto,
} from 'modules/transaction/dtos';
import { UserConfigService } from 'modules/user/services';
import { ErrorResponseDto } from 'common/dtos';

@Controller('Notifications')
@ApiTags('Notifications')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(AuthUserInterceptor)
@ApiBearerAuth()
@Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
export class NotificationController {
  constructor(
    private readonly _transactionService: TransactionService,
    private readonly _userConfigSerivce: UserConfigService,
  ) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @ApiOperation({
    summary: 'Get transaction notifications',
    description: 'Retrieve paginated list of new transaction notifications for the authenticated user. This endpoint marks notifications as read.',
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
    description: 'Transaction notifications retrieved successfully',
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
    const [transactions] = await Promise.all([
      this._transactionService.getTransactions(user, pageOptionsDto),
      this._userConfigSerivce.setNotification(user.userConfig, true),
    ]);

    return transactions;
  }
}
