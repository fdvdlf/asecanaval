import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum, IsString, Length } from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty()
  @IsString()
  @Length(8, 12)
  dni: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;
}
