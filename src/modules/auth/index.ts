import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from 'modules/auth/controllers';
import { AuthService, RefreshTokenService, TokenBlacklistService } from 'modules/auth/services';
import { JwtResetPasswordStrategy, JwtStrategy } from 'modules/auth/strategies';
import { UserModule } from 'modules/user';
import { RefreshTokenRepository, BlacklistedTokenRepository } from 'modules/user/repositories';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([
      RefreshTokenRepository,
      BlacklistedTokenRepository,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenService, TokenBlacklistService, JwtStrategy, JwtResetPasswordStrategy],
  exports: [PassportModule.register({ defaultStrategy: 'jwt' }), AuthService],
})
export class AuthModule {}
