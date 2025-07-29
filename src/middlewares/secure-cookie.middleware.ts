import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecureCookieMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const originalCookie = res.cookie;
    res.cookie = function(name: string, value: any, options: any = {}) {
      const secureOptions = {
        ...options,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 3600000,
        domain: process.env.NODE_ENV === 'production' ? '.pietrzakadrian.com' : undefined
      };
      return originalCookie.call(this, name, value, secureOptions);
    };
    next();
  }
}
