import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches, Validate } from 'class-validator';
import { IsPasswordStrong } from '../validators/password-strength.validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @Validate(IsPasswordStrong)
  @ApiProperty({ 
    minLength: 8,
    description: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
  })
  readonly newPassword: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly confirmPassword: string;
}
