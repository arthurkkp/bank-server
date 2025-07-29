import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
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
import { AuthGuard, JwtResetPasswordGuard, RolesGuard } from 'guards';
import { AuthUserInterceptor } from 'interceptors';
import {
  LoginPayloadDto,
  UserForgottenPasswordDto,
  UserLoginDto,
  UserRegisterDto,
  UserResetPasswordDto,
} from 'modules/auth/dtos';
import { AuthService } from 'modules/auth/services';
import { UserDto } from 'modules/user/dtos';
import { UserEntity } from 'modules/user/entities';
import { UserAuthService, UserService } from 'modules/user/services';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Controller('Auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly _userService: UserService,
    private readonly _userAuthService: UserAuthService,
    private readonly _authService: AuthService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    type: LoginPayloadDto,
    description: 'User successfully authenticated with access token',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed - invalid PIN code or password',
  })
  async userLogin(
    @Body() userLoginDto: UserLoginDto,
  ): Promise<LoginPayloadDto> {
    const user = await this._authService.validateUser(userLoginDto);
    const token = await this._authService.createToken(user);

    return new LoginPayloadDto(user.toDto(), token);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    type: UserDto,
    description: 'User successfully registered with auto-generated PIN code',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email already exists',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async userRegister(
    @Body() userRegisterDto: UserRegisterDto,
  ): Promise<UserDto> {
    const user = await this._userService.createUser(userRegisterDto);
    return user.toDto();
  }

  @Patch('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'User successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  async userLogout(@AuthUser() user: UserEntity): Promise<void> {
    await this._userAuthService.updateLastLogoutDate(user.userAuth);
  }

  @Post('password/forget')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Password reset token sent to email if account exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email format or validation error',
  })
  async forgetPassword(
    @Body() userForgottenPasswordDto: UserForgottenPasswordDto,
  ): Promise<void> {
    await this._authService.handleForgottenPassword(userForgottenPasswordDto);
  }

  @Patch('password/reset')
  @ApiBearerAuth()
  @UseGuards(JwtResetPasswordGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Password successfully reset',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid password format or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired reset token',
  })
  @Transactional()
  async resetPassword(
    @Body() { password }: UserResetPasswordDto,
    @Req() { user },
  ) {
    return this._authService.handleResetPassword(password, user);
  }
}
