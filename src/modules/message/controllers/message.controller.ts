import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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

@Controller('Messages')
@ApiTags('Messages')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(AuthUserInterceptor)
@ApiBearerAuth()
export class MessageController {
  constructor(private readonly _messageService: MessageService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Get paginated list of user's messages",
    type: MessagesPageDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Create new message (Admin/Root only)',
    type: MessageDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - invalid message data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (Admin/Root required)',
  })
  @Roles(RoleType.ADMIN, RoleType.ROOT)
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageDto | any> {
    return this._messageService.createMessage(createMessageDto);
  }

  @Patch('/')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Mark message as read',
    type: MessageDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid message ID or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found or not accessible to user',
  })
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  async readMessage(
    @AuthUser() user: UserEntity,
    @Body() readMessageDto: ReadMessageDto,
  ): Promise<MessageDto | any> {
    return this._messageService.readMessages(user, readMessageDto);
  }
}
