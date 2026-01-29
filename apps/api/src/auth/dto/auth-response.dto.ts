import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  dni: string;

  @ApiProperty({ enum: Role })
  role: Role;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  mustChangePassword: boolean;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}

export class RefreshResponseDto {
  @ApiProperty()
  accessToken: string;
}
