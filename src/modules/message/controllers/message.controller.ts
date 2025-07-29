import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiResponse,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiQuery,
  ApiBody
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
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { MessageService } from 'modules/message/services';
import {
  MessagesPageOptionsDto,
  MessagesPageDto,
  MessageDto,
  ReadMessageDto,
  CreateMessageDto,
} from 'modules/message/dtos';
import { AuthUser, Roles } from 'decorators';
import { UserEntity } from 'modules/user/entities';
import { AuthGuard, RolesGuard } from 'guards';
import { AuthUserInterceptor } from 'interceptors';
import { RoleType } from 'common/constants';
import { ErrorResponseDto, BankingErrorResponseDto } from 'common/dtos';

@Controller('Messages')
@ApiTags('Messages')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(AuthUserInterceptor)
@ApiBearerAuth()
export class MessageController {
  constructor(private readonly _messageService: MessageService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user messages',
    description: 'Retrieve paginated list of messages for the authenticated user',
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
    description: 'Messages retrieved successfully',
    type: MessagesPageDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
  })
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  async getMessages(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: MessagesPageOptionsDto,
    @AuthUser() user: UserEntity,
  ): Promise<MessagesPageDto | undefined | any> {
    return this._messageService.getMessages(user, pageOptionsDto);
  }

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create system message',
    description: 'Create a new system message (admin/root only)',
  })
  @ApiBody({
    type: CreateMessageDto,
    description: 'Message creation data'
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Message created successfully',
    type: MessageDto
  })
  @ApiBadRequestResponse({
    description: 'Message validation failed',
    type: BankingErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
  })
  @Roles(RoleType.ADMIN, RoleType.ROOT)
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageDto | any> {
    return this._messageService.createMessage(createMessageDto);
  }

  @Patch('/')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark message as read',
    description: 'Mark one or more messages as read by the authenticated user',
  })
  @ApiBody({
    type: ReadMessageDto,
    description: 'Message read confirmation data'
  })
  @ApiNoContentResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Message marked as read successfully'
  })
  @ApiBadRequestResponse({
    description: 'Invalid message ID or access denied',
    type: BankingErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
  })
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  async readMessage(
    @AuthUser() user: UserEntity,
    @Body() readMessageDto: ReadMessageDto,
  ): Promise<MessageDto | any> {
    return this._messageService.readMessages(user, readMessageDto);
  }
}
