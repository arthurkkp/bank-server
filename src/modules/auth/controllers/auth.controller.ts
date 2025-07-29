import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Get,
  Delete,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  Headers,
  Ip,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
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
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { TwoFactorSetupDto, TwoFactorVerifyDto } from '../dtos/two-factor-setup.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { AuthService } from 'modules/auth/services';
import { AuthSecurityService } from '../services/auth-security.service';
import { TwoFactorService } from '../services/two-factor.service';
import { UserDto } from 'modules/user/dtos';
import { UserEntity } from 'modules/user/entities';
import { UserAuthService, UserService } from 'modules/user/services';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import * as crypto from 'crypto';

@Controller('Auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly _userService: UserService,
    private readonly _userAuthService: UserAuthService,
    private readonly _authService: AuthService,
    private readonly _authSecurityService: AuthSecurityService,
    private readonly _twoFactorService: TwoFactorService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async userLogin(
    @Body() userLoginDto: UserLoginDto & { twoFactorToken?: string },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('x-device-fingerprint') deviceFingerprint: string,
  ): Promise<any> {
    try {
      const user = await this._authService.validateUser(userLoginDto);
      
      const enhancedResult = await this._authSecurityService.enhancedLogin(
        user,
        ipAddress,
        userAgent || 'Unknown',
        deviceFingerprint || this.generateDeviceFingerprint(userAgent, ipAddress),
        userLoginDto.twoFactorToken
      );

      if (enhancedResult.requiresTwoFactor) {
        return enhancedResult;
      }

      const token = await this._authService.createToken(user);
      
      return {
        ...new LoginPayloadDto(user.toDto(), token),
        refreshToken: enhancedResult.refreshToken,
        expiresIn: enhancedResult.expiresIn,
      };
    } catch (error) {
      if (error.message !== 'Invalid two-factor authentication code') {
        const user = await this._userAuthService.findUserAuth({ pinCode: userLoginDto.pinCode });
        if (user) {
          await this._authSecurityService.recordFailedLogin(user.userAuth.id, ipAddress);
        }
      }
      throw error;
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    type: UserDto,
    description: 'Successfully Registered',
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
    description: 'Successfully Logout',
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
    description: 'Successfully token created',
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
    description: 'Successfully reseted password',
  })
  @Transactional()
  async resetPassword(
    @Body() { password }: UserResetPasswordDto,
    @Req() { user },
  ) {
    return this._authService.handleResetPassword(password, user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<any> {
    return this._authSecurityService.refreshTokens(
      refreshTokenDto.refreshToken,
      refreshTokenDto.deviceFingerprint,
      ipAddress,
      userAgent || 'Unknown'
    );
  }

  @Post('2fa/setup')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Two-factor authentication setup initiated',
  })
  async setupTwoFactor(@AuthUser() user: UserEntity): Promise<any> {
    return this._twoFactorService.generateSecret(user.userAuth.id);
  }

  @Post('2fa/enable')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Two-factor authentication enabled',
  })
  async enableTwoFactor(
    @AuthUser() user: UserEntity,
    @Body() twoFactorSetupDto: TwoFactorSetupDto,
  ): Promise<any> {
    const success = await this._twoFactorService.enableTwoFactor(user.userAuth.id, twoFactorSetupDto.token);
    if (!success) {
      throw new Error('Invalid two-factor authentication code');
    }
    return { message: 'Two-factor authentication enabled successfully' };
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Two-factor authentication disabled',
  })
  async disableTwoFactor(
    @AuthUser() user: UserEntity,
    @Body() twoFactorVerifyDto: TwoFactorVerifyDto,
  ): Promise<any> {
    const success = await this._twoFactorService.disableTwoFactor(user.userAuth.id, twoFactorVerifyDto.token);
    if (!success) {
      throw new Error('Invalid two-factor authentication code');
    }
    return { message: 'Two-factor authentication disabled successfully' };
  }

  @Post('2fa/backup-codes')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'New backup codes generated',
  })
  async generateBackupCodes(@AuthUser() user: UserEntity): Promise<any> {
    const backupCodes = await this._twoFactorService.generateNewBackupCodes(user.userAuth.id);
    return { backupCodes };
  }

  @Get('2fa/status')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Two-factor authentication status',
  })
  async getTwoFactorStatus(@AuthUser() user: UserEntity): Promise<any> {
    return this._twoFactorService.getTwoFactorStatus(user.userAuth.id);
  }

  @Post('logout-all')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Successfully logged out from all devices',
  })
  async logoutAll(@AuthUser() user: UserEntity): Promise<void> {
    await this._authSecurityService.logoutAll(user.userAuth.id);
  }

  @Get('sessions')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'User device sessions',
  })
  async getUserSessions(@AuthUser() user: UserEntity): Promise<any> {
    return this._authSecurityService.getUserDeviceSessions(user.userAuth.id);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @Roles(RoleType.USER, RoleType.ADMIN, RoleType.ROOT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Session revoked successfully',
  })
  async revokeSession(
    @AuthUser() user: UserEntity,
    @Param('sessionId') sessionId: number,
  ): Promise<void> {
    await this._authSecurityService.revokeDeviceSession(user.userAuth.id, sessionId);
  }

  private generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    return crypto.createHash('sha256')
      .update(`${userAgent}-${ipAddress}`)
      .digest('hex')
      .substring(0, 32);
  }
}
