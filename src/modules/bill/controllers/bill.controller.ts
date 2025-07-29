import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleType } from 'common/constants';
import { AuthUser, Roles } from 'decorators';
import { AuthGuard, RolesGuard } from 'guards';
import { AuthUserInterceptor } from 'interceptors';
import {
  BillDto,
  BillsPageDto,
  BillsPageOptionsDto,
  CreateBillDto,
  SearchBillsPayloadDto,
  TotalAccountBalanceHistoryPayloadDto,
  TotalAccountBalancePayloadDto,
  TotalAmountMoneyPayloadDto,
} from 'modules/bill/dtos';
import { BillService } from 'modules/bill/services';
import { UserEntity } from 'modules/user/entities';

@Controller('Bills')
@ApiTags('Bills')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(AuthUserInterceptor)
@ApiBearerAuth()
export class BillController {
  constructor(private _billService: BillService) {}

  @Get('/')
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Get paginated list of user's bank accounts with balances",
    type: BillsPageDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async userBills(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: BillsPageOptionsDto,
    @AuthUser() user: UserEntity,
  ): Promise<BillsPageDto> {
    return this._billService.getBills(user, pageOptionsDto);
  }

  @Post('/')
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Create new bank account with specified currency (max 5 accounts per user)",
    type: BillDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid currency or maximum account limit reached (5 accounts)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async createBill(
    @AuthUser() user: UserEntity,
    @Body() createBillDto: CreateBillDto,
  ): Promise<BillDto> {
    const bill = await this._billService.createAccountBill({
      user,
      currency: createBillDto.currency,
    });
    return bill.toDto();
  }

  @Get('/amountMoney')
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Get user's total amount of money across all accounts",
    type: TotalAmountMoneyPayloadDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async userAmountMoney(
    @AuthUser() user: UserEntity,
  ): Promise<TotalAmountMoneyPayloadDto> {
    return this._billService.getTotalAmountMoney(user);
  }

  @Get('/accountBalance')
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Get user's current total account balance",
    type: TotalAccountBalancePayloadDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async userAccountBalance(
    @AuthUser() user: UserEntity,
  ): Promise<TotalAccountBalancePayloadDto> {
    return this._billService.getTotalAccountBalance(user);
  }

  @Get('/accountBalanceHistory')
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Get user's account balance history over time",
    type: TotalAccountBalanceHistoryPayloadDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async userAccountBalanceHistory(
    @AuthUser() user: UserEntity,
  ): Promise<TotalAccountBalanceHistoryPayloadDto> {
    return this._billService.getTotalAccountBalanceHistory(user);
  }

  @Get('/:accountBillNumber/search')
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get bills',
    type: BillsPageDto,
  })
  async searchBills(
    @Param('accountBillNumber') accountBillNumber: string,
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: BillsPageOptionsDto,
    @AuthUser() user: UserEntity,
  ): Promise<SearchBillsPayloadDto> {
    return this._billService.searchBill(
      accountBillNumber,
      pageOptionsDto,
      user,
    );
  }
}
