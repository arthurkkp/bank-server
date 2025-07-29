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
import { 
  ApiBearerAuth, 
  ApiResponse, 
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
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
import { ErrorResponseDto, BankingErrorResponseDto } from 'common/dtos';

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
  @ApiOperation({
    summary: 'Get user bills/accounts',
    description: 'Retrieve paginated list of user bank accounts with balance information',
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
    description: 'Bills retrieved successfully',
    type: BillsPageDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
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
  @ApiOperation({
    summary: 'Create new bank account',
    description: 'Create a new bank account/bill for the authenticated user with specified currency',
  })
  @ApiBody({
    type: CreateBillDto,
    description: 'Account creation details'
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Account created successfully',
    type: BillDto
  })
  @ApiBadRequestResponse({
    description: 'Account creation failed',
    type: BankingErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
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
    description: "Get User's amount money",
    type: TotalAmountMoneyPayloadDto,
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
    description: "Get User's account balance history",
    type: TotalAccountBalancePayloadDto,
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
    description: "Get User's account balance history",
    type: TotalAccountBalanceHistoryPayloadDto,
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
