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
  ApiTags,
  ApiOperation,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBody,
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
import { ErrorResponseDto, BankingErrorResponseDto } from 'common/dtos';

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
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with PIN code and password to receive JWT access token for API access',
  })
  @ApiBody({
    type: UserLoginDto,
    description: 'User login credentials',
    examples: {
      validLogin: {
        summary: 'Valid login credentials',
        value: {
          pinCode: 123456,
          password: 'SecurePassword123!'
        }
      }
    }
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    type: LoginPayloadDto,
    description: 'User successfully authenticated with access token'
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials or validation errors',
    type: BankingErrorResponseDto
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
  @ApiOperation({
    summary: 'User registration',
    description: 'Register a new user account in the banking system',
  })
  @ApiBody({
    type: UserRegisterDto,
    description: 'User registration data'
  })
  @ApiOkResponse({
    status: HttpStatus.OK,
    type: UserDto,
    description: 'User successfully registered'
  })
  @ApiBadRequestResponse({
    description: 'Registration validation errors or email already exists',
    type: BankingErrorResponseDto
  })
  async userRegister(
    @Body() userRegisterDto: UserRegisterDto,
  ): Promise<UserDto> {
    const user = await this._userService.createUser(userRegisterDto);
    return user.toDto();
  }

  @Patch('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout user and update last logout timestamp',
  })
  @ApiNoContentResponse({
    description: 'User successfully logged out',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
    type: ErrorResponseDto
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
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Send password reset email with secure token to user',
  })
  @ApiBody({
    type: UserForgottenPasswordDto,
    description: 'User email for password reset'
  })
  @ApiNoContentResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Password reset email sent successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid email address or user not found',
    type: BankingErrorResponseDto
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
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password using secure reset token from email',
  })
  @ApiBody({
    type: UserResetPasswordDto,
    description: 'New password for user account'
  })
  @ApiNoContentResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Password successfully reset',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired reset token',
    type: BankingErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid reset token',
    type: ErrorResponseDto
  })
  @Transactional()
  async resetPassword(
    @Body() { password }: UserResetPasswordDto,
    @Req() { user },
  ) {
    return this._authService.handleResetPassword(password, user);
  }
}
