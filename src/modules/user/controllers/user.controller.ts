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
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleType } from 'common/constants';
import { AbstractCheckDto } from 'common/dtos';
import { AuthUser, Roles } from 'decorators';
import { AuthGuard, RolesGuard } from 'guards';
import { AuthUserInterceptor } from 'interceptors';
import { UserEntity } from 'modules/user/entities';
import { UserConfigService, UserService } from 'modules/user/services';
import { UserDto, UserUpdateDto } from 'modules/user/dtos';

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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get authenticated user profile data',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update user profile information',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Check if email address is already registered',
    type: AbstractCheckDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email format',
  })
  async checkEmail(@Param('email') email: string): Promise<AbstractCheckDto> {
    const userEmail = await this._userService.getUser({
      email: email.toLocaleLowerCase(),
    });
    return new AbstractCheckDto(userEmail);
  }
}
