import { ApiProperty } from '@nestjs/swagger';
import { DueStatus } from '@prisma/client';

export class AdminDueItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  member_id: number;

  @ApiProperty()
  dni: string;

  @ApiProperty({ nullable: true })
  cip?: string | null;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  promocion: string;

  @ApiProperty()
  grado: string;

  @ApiProperty()
  especialidad: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: DueStatus })
  status: DueStatus;

  @ApiProperty()
  due_date: Date;
}

export class AdminDuesListResponseDto {
  @ApiProperty({ type: [AdminDueItemDto] })
  data: AdminDueItemDto[];

  @ApiProperty()
  total: number;
}
