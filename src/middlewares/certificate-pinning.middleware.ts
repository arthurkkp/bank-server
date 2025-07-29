import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CertificatePinningMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    if (process.env.NODE_ENV === 'production') {
      const pins = [
        'pin-sha256="base64-encoded-sha256-hash-of-current-cert"',
        'pin-sha256="base64-encoded-sha256-hash-of-backup-cert"'
      ];
      
      res.setHeader(
        'Public-Key-Pins',
        `${pins.join('; ')}; max-age=5184000; includeSubDomains; report-uri="https://api.pietrzakadrian.com/hpkp-report"`
      );
    }
    next();
  }
}
