import { ApiProperty } from '@nestjs/swagger';
import { MemberStatus } from '@prisma/client';

export class MemberListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  dni: string;

  @ApiProperty({ required: false, nullable: true })
  cip?: string | null;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  grado: string;

  @ApiProperty()
  promo: string;

  @ApiProperty({ enum: MemberStatus })
  estado: MemberStatus;

  @ApiProperty()
  especialidad: string;

  @ApiProperty({ required: false, nullable: true })
  email?: string | null;
}

export class MembersListResponseDto {
  @ApiProperty({ type: [MemberListItemDto] })
  data: MemberListItemDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;
}

export class MemberDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  dni: string;

  @ApiProperty({ required: false, nullable: true })
  cip?: string | null;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  promocion: string;

  @ApiProperty()
  grado: string;

  @ApiProperty()
  especialidad: string;

  @ApiProperty()
  situacion: string;

  @ApiProperty()
  forma_aporte: string;

  @ApiProperty({ required: false, nullable: true })
  email?: string | null;

  @ApiProperty({ required: false, nullable: true })
  celular?: string | null;

  @ApiProperty({ required: false, nullable: true })
  telefono_casa?: string | null;

  @ApiProperty({ required: false, nullable: true })
  direccion?: string | null;

  @ApiProperty({ required: false, nullable: true })
  distrito?: string | null;

  @ApiProperty({ enum: MemberStatus })
  estado: MemberStatus;

  @ApiProperty({ required: false, nullable: true })
  foto_url?: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
