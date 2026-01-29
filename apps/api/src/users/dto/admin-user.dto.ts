import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AdminUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  dni: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty({ required: false, nullable: true })
  email?: string | null;
}

export class AdminUsersListResponseDto {
  @ApiProperty({ type: [AdminUserDto] })
  data: AdminUserDto[];
}
