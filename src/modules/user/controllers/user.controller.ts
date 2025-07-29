import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiResponse, 
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBody,
  ApiParam
} from '@nestjs/swagger';
import { RoleType } from 'common/constants';
import { AbstractCheckDto } from 'common/dtos';
import { AuthUser, Roles } from 'decorators';
import { AuthGuard, RolesGuard } from 'guards';
import { AuthUserInterceptor } from 'interceptors';
import { UserEntity } from 'modules/user/entities';
import { UserConfigService, UserService } from 'modules/user/services';
import { UserDto, UserUpdateDto } from 'modules/user/dtos';
import { ErrorResponseDto, BankingErrorResponseDto } from 'common/dtos';

@Controller('Users')
@ApiTags('Users')
export class UserController {
  constructor(
    private readonly _userService: UserService,
    private readonly _userConfigService: UserConfigService,
  ) {}

  @Get('/')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve authenticated user profile information',
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
  })
  async getUserData(@AuthUser() user: UserEntity): Promise<UserDto> {
    const userEntity = await this._userService.getUser({ uuid: user.uuid });
    return userEntity.toDto();
  }

  @Patch('/')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update authenticated user profile information',
  })
  @ApiBody({
    type: UserUpdateDto,
    description: 'User profile update data'
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully',
    type: UserDto
  })
  @ApiBadRequestResponse({
    description: 'Validation errors or email already exists',
    type: BankingErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
  })
  async setUserData(
    @AuthUser() user: UserEntity,
    @Body() userUpdateDto: UserUpdateDto,
  ): Promise<UserDto> {
    const userWithNewData = await this._userService.updateUserData(
      user,
      userUpdateDto,
    );
    return userWithNewData.toDto();
  }

  @Get('/:email/checkEmail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check email availability',
    description: 'Check if an email address is already registered in the system',
  })
  @ApiParam({
    name: 'email',
    description: 'Email address to check',
    example: 'john.doe@example.com',
    type: 'string'
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Email check completed',
    type: AbstractCheckDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
    type: BankingErrorResponseDto
  })
  async checkEmail(@Param('email') email: string): Promise<AbstractCheckDto> {
    const userEmail = await this._userService.getUser({
      email: email.toLocaleLowerCase(),
    });
    return new AbstractCheckDto(userEmail);
  }
}
