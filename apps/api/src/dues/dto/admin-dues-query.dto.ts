import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DueStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class AdminDuesQueryDto {
  @ApiProperty({ example: '2025-11' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month: string;

  @ApiPropertyOptional({ enum: DueStatus })
  @IsOptional()
  @IsEnum(DueStatus)
  status?: DueStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promocion?: string;
}
