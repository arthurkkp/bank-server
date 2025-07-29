import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { 
  ApiResponse, 
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery
} from '@nestjs/swagger';
import {
  CurrenciesPageDto,
  CurrenciesPageOptionsDto,
} from 'modules/currency/dtos';
import { CurrencyService } from 'modules/currency/services';

@Controller('Currencies')
@ApiTags('Currency')
export class CurrencyController {
  constructor(private readonly _currencyService: CurrencyService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get available currencies',
    description: 'Retrieve paginated list of supported currencies with exchange rates for banking operations',
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
    description: 'Currencies retrieved successfully',
    type: CurrenciesPageDto
  })
  async getAvailableCurrencies(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: CurrenciesPageOptionsDto,
  ): Promise<CurrenciesPageDto> {
    return this._currencyService.getCurrencies(pageOptionsDto);
  }
}
