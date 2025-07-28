import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  UserNotFoundException,
  UserPasswordNotValidException,
} from 'exceptions';
import {
  ForgottenPasswordPayloadDto,
  TokenPayloadDto,
  UserForgottenPasswordDto,
  UserLoginDto,
  EnhancedTokenPayloadDto,
  RefreshTokenRequestDto,
} from 'modules/auth/dtos';
import {
  UserAuthForgottenPasswordEntity,
  UserEntity,
} from 'modules/user/entities';
import {
  UserAuthForgottenPasswordService,
  UserAuthService,
  UserService,
  PasswordHistoryService,
  SessionManagementService,
} from 'modules/user/services';
import { ContextService } from 'providers';
import { UtilsService } from 'utils/services';
import { ConfigService } from '@nestjs/config';
import {
  ForgottenTokenHasUsedException,
  WrongCredentialsProvidedException,
} from '../exceptions';
import { RefreshTokenService } from './refresh-token.service';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  private static _authUserKey = 'user_key';

  constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
    private readonly _userService: UserService,
    private readonly _userAuthService: UserAuthService,
    private readonly _userAuthForgottenPasswordService: UserAuthForgottenPasswordService,
    private readonly _refreshTokenService: RefreshTokenService,
    private readonly _tokenBlacklistService: TokenBlacklistService,
    private readonly _passwordHistoryService: PasswordHistoryService,
    private readonly _sessionManagementService: SessionManagementService,
  ) {}

  public async createToken(user: UserEntity, deviceInfo?: any): Promise<EnhancedTokenPayloadDto> {
    const {
      uuid,
      userAuth: { role },
    } = user;

    const accessTokenExpiration = 1800;
    const refreshTokenExpiration = 30 * 24 * 60 * 60;

    const accessToken = await this._jwtService.signAsync(
      { uuid, role },
      { expiresIn: accessTokenExpiration }
    );

    const { token: refreshToken } = await this._refreshTokenService.createRefreshToken(
      user,
      deviceInfo
    );

    return new EnhancedTokenPayloadDto({
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiration,
      refreshExpiresIn: refreshTokenExpiration,
    });
  }

  public async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    const { pinCode, password } = userLoginDto;
    let user = await this._userAuthService.findUserAuth({ pinCode });

    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.userAuth.lockedUntil && user.userAuth.lockedUntil > new Date()) {
      throw new UserPasswordNotValidException();
    }

    const isPasswordValid = await UtilsService.validateHash(
      password,
      user.userAuth.password,
    );

    if (!isPasswordValid) {
      await this._userAuthService.incrementFailedLoginAttempts(user.userAuth);
      throw new UserPasswordNotValidException();
    }

    await this._userAuthService.resetFailedLoginAttempts(user.userAuth);

    user = await this._userAuthService.updateLastLoggedDate(
      user,
      isPasswordValid,
    );

    return user;
  }

  public static setAuthUser(user: UserEntity): void {
    ContextService.set(AuthService._authUserKey, user);
  }

  public static getAuthUser(): UserEntity {
    return ContextService.get(AuthService._authUserKey);
  }

  public async handleForgottenPassword(
    userForgottenPasswordDto: UserForgottenPasswordDto,
  ): Promise<void> {
    const { user, token } = await this._createForgottenPasswordToken(
      userForgottenPasswordDto,
    );

    const url = `https://bank.pietrzakadrian.com/password/reset/${token}`;

    return this._userAuthForgottenPasswordService.sendEmailWithToken(
      user,
      url,
      userForgottenPasswordDto.locale,
    );
  }

  public async handleResetPassword(
    password: string,
    userAuthForgottenPasswordEntity: UserAuthForgottenPasswordEntity,
  ): Promise<void> {
    if (userAuthForgottenPasswordEntity.used) {
      throw new ForgottenTokenHasUsedException();
    }

    const user = userAuthForgottenPasswordEntity.user;
    
    const isPasswordReused = await this._passwordHistoryService.isPasswordReused(user, password);
    if (isPasswordReused) {
      throw new WrongCredentialsProvidedException();
    }

    await Promise.all([
      this._userAuthForgottenPasswordService.changeTokenActiveStatus(
        userAuthForgottenPasswordEntity,
        true,
      ),
      this._userAuthService.updatePassword(
        userAuthForgottenPasswordEntity.user.userAuth,
        password,
      ),
      this._passwordHistoryService.addPasswordToHistory(user, password),
    ]);
  }

  public async validateForgottenPasswordToken(
    forgottenPassword: UserAuthForgottenPasswordEntity,
    token: string,
  ): Promise<void> {
    const isForgottenPasswordTokenMatching = await UtilsService.validateHash(
      token,
      forgottenPassword.hashedToken,
    );

    if (!isForgottenPasswordTokenMatching) {
      throw new WrongCredentialsProvidedException();
    }
  }

  private async _createForgottenPasswordToken({
    emailAddress,
    locale,
  }: UserForgottenPasswordDto): Promise<ForgottenPasswordPayloadDto> {
    const user = await this._userService.getUser({ email: emailAddress });

    if (!user) {
      throw new WrongCredentialsProvidedException();
    }

    const hashedToken = await this._getJwtForgottenPasswordAccessToken({
      uuid: user.uuid,
    });

    await this._userAuthForgottenPasswordService.createForgottenPassword({
      hashedToken,
      user,
      emailAddress,
      locale,
    });

    return new ForgottenPasswordPayloadDto(hashedToken, user);
  }

  private async _getJwtForgottenPasswordAccessToken(payload): Promise<string> {
    const token = await this._jwtService.signAsync(payload, {
      secret: this._configService.get('JWT_FORGOTTEN_PASSWORD_TOKEN_SECRET'),
      expiresIn: `${this._configService.get(
        'JWT_FORGOTTEN_PASSWORD_TOKEN_EXPIRATION_TIME',
      )}s`,
    });

    return token;
  }

  public async refreshToken(refreshTokenRequestDto: RefreshTokenRequestDto, deviceInfo?: any): Promise<EnhancedTokenPayloadDto> {
    const { refreshToken } = refreshTokenRequestDto;
    
    const refreshTokenEntity = await this._refreshTokenService.validateRefreshToken(refreshToken);
    if (!refreshTokenEntity) {
      throw new WrongCredentialsProvidedException();
    }

    const { token: newRefreshToken } = await this._refreshTokenService.rotateRefreshToken(
      refreshTokenEntity,
      deviceInfo
    );

    const {
      uuid,
      userAuth: { role },
    } = refreshTokenEntity.user;

    const accessTokenExpiration = 1800;
    const refreshTokenExpiration = 30 * 24 * 60 * 60;

    const accessToken = await this._jwtService.signAsync(
      { uuid, role },
      { expiresIn: accessTokenExpiration }
    );

    return new EnhancedTokenPayloadDto({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: accessTokenExpiration,
      refreshExpiresIn: refreshTokenExpiration,
    });
  }

  public async logout(user: UserEntity, accessToken: string): Promise<void> {
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 1);
    
    await Promise.all([
      this._tokenBlacklistService.blacklistToken(accessToken, tokenExpiration),
      this._refreshTokenService.revokeAllUserRefreshTokens(user),
      this._userAuthService.updateLastLogoutDate(user.userAuth),
    ]);
  }
}
