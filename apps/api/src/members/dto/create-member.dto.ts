import { ApiProperty } from '@nestjs/swagger';
import { MemberStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateMemberDto {
  @ApiProperty()
  @IsString()
  dni: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  cip?: string | null;

  @ApiProperty()
  @IsString()
  nombres: string;

  @ApiProperty()
  @IsString()
  apellidos: string;

  @ApiProperty()
  @IsString()
  promocion: string;

  @ApiProperty()
  @IsString()
  grado: string;

  @ApiProperty()
  @IsString()
  especialidad: string;

  @ApiProperty()
  @IsString()
  situacion: string;

  @ApiProperty()
  @IsString()
  forma_aporte: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  celular?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  telefono_casa?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  direccion?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  distrito?: string | null;

  @ApiProperty({ enum: MemberStatus })
  @IsEnum(MemberStatus)
  estado: MemberStatus;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  foto_url?: string | null;
}
