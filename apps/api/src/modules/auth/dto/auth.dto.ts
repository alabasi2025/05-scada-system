import { IsString, IsNotEmpty, IsEmail, IsEnum, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  ENGINEER = 'engineer',
}

export class RegisterDto {
  @ApiProperty({ description: 'اسم المستخدم', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام و _ فقط' })
  username: string;

  @ApiProperty({ description: 'البريد الإلكتروني', example: 'admin@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({ description: 'كلمة المرور', example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص',
  })
  password: string;

  @ApiProperty({ description: 'الاسم الكامل', example: 'أحمد محمد' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName: string;

  @ApiProperty({ description: 'الدور', enum: UserRole, example: UserRole.OPERATOR })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}

export class LoginDto {
  @ApiProperty({ description: 'اسم المستخدم أو البريد الإلكتروني', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'كلمة المرور', example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'كلمة المرور الحالية' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'كلمة المرور الجديدة' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص',
  })
  newPassword: string;
}
