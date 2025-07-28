import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenBlacklistService } from 'modules/auth/services/token-blacklist.service';

@Injectable()
export class TokenBlacklistMiddleware implements NestMiddleware {
  constructor(private readonly _tokenBlacklistService: TokenBlacklistService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (await this._tokenBlacklistService.isTokenBlacklisted(token)) {
        throw new UnauthorizedException('Token has been blacklisted');
      }
    }

    next();
  }
}
