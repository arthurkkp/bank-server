import { ApiProperty } from '@nestjs/swagger';

export class TokenPayloadDto {
  @ApiProperty()
  readonly expiresIn: number;

  @ApiProperty()
  readonly accessToken: string;

  @ApiProperty({ required: false })
  readonly cookieOptions?: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
    maxAge: number;
  };

  constructor(data: { 
    expiresIn: number; 
    accessToken: string;
    cookieOptions?: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: string;
      maxAge: number;
    };
  }) {
    this.expiresIn = data.expiresIn;
    this.accessToken = data.accessToken;
    this.cookieOptions = data.cookieOptions;
  }
}
