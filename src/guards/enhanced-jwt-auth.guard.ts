import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenBlacklistService } from 'modules/auth/services/token-blacklist.service';

@Injectable()
export class EnhancedJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly _tokenBlacklistService: TokenBlacklistService) {
    super();
  }

  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this._extractTokenFromHeader(request);

    if (token && await this._tokenBlacklistService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been blacklisted');
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  private _extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
