import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from 'common/dtos';
import { UserSessionEntity } from '../entities';

export class UserSessionDto extends AbstractDto {
  @ApiProperty()
  sessionToken: string;

  @ApiProperty()
  deviceInfo: any;

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  userAgent: string;

  @ApiProperty()
  lastActivity: Date;

  @ApiProperty()
  expiresAt: Date;

  constructor(userSession: UserSessionEntity) {
    super(userSession);
    this.sessionToken = userSession.sessionToken;
    this.deviceInfo = userSession.deviceInfo;
    this.ipAddress = userSession.ipAddress;
    this.userAgent = userSession.userAgent;
    this.lastActivity = userSession.lastActivity;
    this.expiresAt = userSession.expiresAt;
  }
}
