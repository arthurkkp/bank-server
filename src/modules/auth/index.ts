import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from 'modules/auth/controllers';
import { AuthService } from 'modules/auth/services';
import { AuthSecurityService } from './services/auth-security.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TwoFactorService } from './services/two-factor.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { PasswordHistoryService } from './services/password-history.service';
import { JwtResetPasswordStrategy, JwtStrategy } from 'modules/auth/strategies';
import { UserModule } from 'modules/user';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { DeviceSessionEntity } from './entities/device-session.entity';
import { SecurityAuditLogEntity } from './entities/security-audit-log.entity';
import { UserTwoFactorEntity } from './entities/user-two-factor.entity';
import { AccountLockoutEntity } from './entities/account-lockout.entity';
import { PasswordHistoryEntity } from './entities/password-history.entity';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([
      RefreshTokenEntity,
      DeviceSessionEntity,
      SecurityAuditLogEntity,
      UserTwoFactorEntity,
      AccountLockoutEntity,
      PasswordHistoryEntity,
      UserEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSecurityService,
    RefreshTokenService,
    TwoFactorService,
    AccountLockoutService,
    PasswordHistoryService,
    JwtStrategy,
    JwtResetPasswordStrategy,
  ],
  exports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthService,
    AuthSecurityService,
    RefreshTokenService,
    TwoFactorService,
    AccountLockoutService,
    PasswordHistoryService,
  ],
})
export class AuthModule {}
